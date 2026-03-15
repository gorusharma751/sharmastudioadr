import os
import re
import logging
import tempfile
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Tuple

import cv2
import numpy as np
import requests
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Config from Environment Variables ────────────────────────────────────────
SUPABASE_URL         = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
GOOGLE_API_KEY       = os.environ.get("GOOGLE_API_KEY", "")
EMBEDDINGS_TABLE     = "face_embeddings"

# insightface cosine similarity threshold — higher = stricter
# 0.3 = loose, 0.4 = standard, 0.5 = strict
MATCH_THRESHOLD = float(os.environ.get("MATCH_THRESHOLD", "0.35"))
BATCH_SIZE = int(os.environ.get("PROCESS_BATCH_SIZE", "100"))

# In-memory background job tracker for long-running Drive processing.
# This avoids browser/network timeouts on large events.
PROCESS_JOBS: Dict[str, dict] = {}
CHUNK_JOBS: Dict[str, dict] = {}


def _update_job(job_id: Optional[str], **fields) -> None:
    if not job_id:
        return
    job = PROCESS_JOBS.get(job_id)
    if not job:
        return
    PROCESS_JOBS[job_id] = {
        **job,
        **fields,
        "updated_at": int(time.time()),
    }

# ─── InsightFace — lazy-load so health endpoint responds immediately ──────────
_face_app = None

def get_face_app():
    global _face_app
    if _face_app is None:
        from insightface.app import FaceAnalysis
        logger.info("Loading InsightFace model (buffalo_sc)...")
        _face_app = FaceAnalysis(
            name="buffalo_sc",                    # ~85 MB, fast, accurate
            providers=["CPUExecutionProvider"],
        )
        _face_app.prepare(ctx_id=0, det_size=(320, 320))
        logger.info("InsightFace model ready ✓")
    return _face_app

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Face Match API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Supabase REST helpers ─────────────────────────────────────────────────────
def _sb_headers(extra: Dict[str, str] = None) -> dict:
    h = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h

def sb_select(table: str, filters: Dict[str, str] = None, select: str = "*") -> List[dict]:
    params = {"select": select}
    if filters:
        params.update(filters)
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers(),
        params=params,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()

def sb_count(table: str, filters: Dict[str, str] = None) -> int:
    params = {"select": "id"}
    if filters:
        params.update(filters)
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers({"Prefer": "count=exact"}),
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    cr = r.headers.get("content-range", "0/0")
    try:
        return int(cr.split("/")[-1])
    except (ValueError, IndexError):
        return 0

def sb_insert(table: str, rows: List[dict]) -> None:
    """Insert rows in batches of 50 to stay under request limits."""
    for i in range(0, len(rows), 50):
        batch = rows[i:i + 50]
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=_sb_headers({"Prefer": "return=minimal"}),
            json=batch,
            timeout=60,
        )
        r.raise_for_status()

def sb_delete(table: str, filters: Dict[str, str]) -> None:
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_sb_headers(),
        params=filters,
        timeout=15,
    )
    r.raise_for_status()

# ─── Google Drive helpers ──────────────────────────────────────────────────────
def extract_folder_id(link: str) -> str:
    m = re.search(r"/folders/([a-zA-Z0-9_-]+)", link)
    if m:
        return m.group(1)
    m = re.search(r"id=([a-zA-Z0-9_-]+)", link)
    if m:
        return m.group(1)
    raise ValueError(f"Cannot extract Google Drive folder ID from: {link}")


def list_drive_images(folder_id: str) -> List[dict]:
    """
    List all image files in a public Google Drive folder.
    Requires GOOGLE_API_KEY env var.
    Returns list of {id, name, photo_url}.
    """
    if not GOOGLE_API_KEY:
        raise RuntimeError(
            "GOOGLE_API_KEY environment variable is not set. "
            "See README for how to create a free Google API Key."
        )

    image_ext = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    files = []
    page_token = None

    while True:
        params = {
            "q": f"'{folder_id}' in parents and trashed = false",
            "fields": "nextPageToken, files(id, name, mimeType)",
            "key": GOOGLE_API_KEY,
            "pageSize": 1000,
            "supportsAllDrives": True,
            "includeItemsFromAllDrives": True,
        }
        if page_token:
            params["pageToken"] = page_token

        resp = requests.get(
            "https://www.googleapis.com/drive/v3/files",
            params=params,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        for f in data.get("files", []):
            name = f.get("name", "")
            mime = f.get("mimeType", "")
            is_image = (
                mime.startswith("image/")
                or Path(name).suffix.lower() in image_ext
            )
            if is_image:
                fid = f["id"]
                files.append({
                    "id": fid,
                    "name": name,
                    # lh3 CDN URL works for publicly shared Drive files
                    "photo_url": f"https://lh3.googleusercontent.com/d/{fid}",
                    "download_url": (
                        f"https://www.googleapis.com/drive/v3/files/{fid}"
                        f"?alt=media&key={GOOGLE_API_KEY}"
                    ),
                })

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return files


def download_file(download_url: str, dest: str):
    """Download a file from the URL into dest path."""
    r = requests.get(download_url, stream=True, timeout=120)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=65536):
            f.write(chunk)


# ─── Face helpers ──────────────────────────────────────────────────────────────
def get_embedding(image_path: str) -> Optional[List[float]]:
    """Extract 512-dim ArcFace embedding. Returns None if no face found."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        faces = get_face_app().get(img)
        if faces:
            return faces[0].embedding.tolist()
    except Exception as e:
        logger.debug(f"No face in {image_path}: {e}")
    return None


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two ArcFace embeddings. > 0.35 = same person."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    na, nb = np.linalg.norm(va), np.linalg.norm(vb)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"status": "Face Match API running ✅", "version": "3.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/test-db")
def test_db():
    """Test Supabase connection."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return {"error": "SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable is not set"}
    try:
        total = sb_count(EMBEDDINGS_TABLE)
        return {"status": "connected", "total_embeddings": total}
    except Exception as e:
        return {"error": str(e)}


@app.get("/event-stats/{event_id}")
def event_stats(event_id: str):
    """How many face embeddings are stored for this event."""
    try:
        total = sb_count(EMBEDDINGS_TABLE, {"event_id": f"eq.{event_id}"})
        return {"event_id": event_id, "total_photos": total}
    except Exception as e:
        return {"error": str(e)}


@app.get("/processing-status/{event_id}")
def processing_status(event_id: str):
    try:
        total = sb_count(EMBEDDINGS_TABLE, {"event_id": f"eq.{event_id}"})
        return {
            "event_id": event_id,
            "total_embedded": total,
            "status": "done" if total > 0 else "not_processed",
        }
    except Exception as e:
        return {"error": str(e)}


def _process_drive_folder_impl(folder_link: str, event_id: str, job_id: Optional[str] = None) -> dict:
    # 1. Extract folder ID
    try:
        folder_id = extract_folder_id(folder_link)
    except ValueError as e:
        return {"error": str(e)}

    logger.info(f"Processing Drive folder {folder_id} for event '{event_id}'")

    # 2. List images
    try:
        files = list_drive_images(folder_id)
    except RuntimeError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to list Drive folder: {e}"}

    if not files:
        return {
            "error": (
                "No images found in the Google Drive folder. "
                "Make sure: (1) The folder is public (Anyone with link → Viewer), "
                "(2) The folder actually contains .jpg/.png images."
            )
        }

    logger.info(f"Found {len(files)} images")
    total_files = len(files)
    total_batches = max(1, (total_files + BATCH_SIZE - 1) // BATCH_SIZE)

    _update_job(
        job_id,
        progress={
            "total_files": total_files,
            "total_batches": total_batches,
            "batch_size": BATCH_SIZE,
            "current_batch": 0,
            "active_batch": 1 if total_batches > 0 else 0,
            "scanned_files": 0,
            "processed_embeddings": 0,
            "committed_embeddings": 0,
            "skipped_files": 0,
            "progress_pct": 0,
        },
        message="Preparing to process photos.",
    )

    # 3. Clear old embeddings for this event, then process
    try:
        sb_delete(EMBEDDINGS_TABLE, {"event_id": f"eq.{event_id}"})
        logger.info(f"Cleared old embeddings for event '{event_id}'")
    except Exception as e:
        return {"error": f"Database error clearing old embeddings: {e}"}

    processed = 0
    skipped = 0
    committed = 0
    tmpdir = tempfile.mkdtemp()
    batch_rows: List[dict] = []

    try:
        for i, f in enumerate(files, start=1):
            logger.info(f"[{i}/{len(files)}] {f['name']}")
            dest = os.path.join(tmpdir, f["name"])

            try:
                r = requests.get(f["download_url"], stream=True, timeout=60)
                r.raise_for_status()
                with open(dest, "wb") as fp:
                    for chunk in r.iter_content(65536):
                        fp.write(chunk)

                embedding = get_embedding(dest)

                if embedding is None:
                    logger.info("  → No face detected, skipping")
                    skipped += 1
                    continue

                batch_rows.append({
                    "event_id": event_id,
                    "filename": f["name"],
                    "file_id": f["id"],
                    "photo_url": f["photo_url"],
                    "embedding": embedding,
                })
                processed += 1
                logger.info("  → Embedded ✓")

            except Exception as e:
                logger.warning(f"  → Error: {e}")
                skipped += 1

            # Emit lightweight progress between batch commits so UI does not appear stuck.
            if (i % 10 == 0) and (i % BATCH_SIZE != 0):
                completed_batches = min(total_batches, i // BATCH_SIZE)
                active_batch = min(total_batches, completed_batches + 1)
                pct = int((i / total_files) * 100) if total_files > 0 else 0
                _update_job(
                    job_id,
                    progress={
                        "total_files": total_files,
                        "total_batches": total_batches,
                        "batch_size": BATCH_SIZE,
                        "current_batch": completed_batches,
                        "active_batch": active_batch,
                        "scanned_files": i,
                        "processed_embeddings": processed,
                        "committed_embeddings": committed,
                        "skipped_files": skipped,
                        "progress_pct": pct,
                    },
                    message=f"Working on batch {active_batch}/{total_batches}...",
                )

            should_flush_batch = (i % BATCH_SIZE == 0) or (i == total_files)
            if should_flush_batch:
                if batch_rows:
                    sb_insert(EMBEDDINGS_TABLE, batch_rows)
                    committed += len(batch_rows)
                    batch_rows = []

                completed_batches = min(total_batches, (i + BATCH_SIZE - 1) // BATCH_SIZE)
                active_batch = min(total_batches, completed_batches + 1)
                pct = int((i / total_files) * 100) if total_files > 0 else 0
                _update_job(
                    job_id,
                    progress={
                        "total_files": total_files,
                        "total_batches": total_batches,
                        "batch_size": BATCH_SIZE,
                        "current_batch": completed_batches,
                        "active_batch": active_batch,
                        "scanned_files": i,
                        "processed_embeddings": processed,
                        "committed_embeddings": committed,
                        "skipped_files": skipped,
                        "progress_pct": pct,
                    },
                    message=f"Batch {completed_batches}/{total_batches} completed.",
                )

        if batch_rows:
            sb_insert(EMBEDDINGS_TABLE, batch_rows)
            committed += len(batch_rows)

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    if processed == 0:
        return {
            "success": False,
            "event_id": event_id,
            "total_files": total_files,
            "total_batches": total_batches,
            "batch_size": BATCH_SIZE,
            "processed": processed,
            "committed": committed,
            "skipped": skipped,
            "error": (
                "No face embeddings were created. "
                "Possible reasons: photos are not readable by OpenCV, faces are not clearly visible, "
                "or Google Drive media download is failing."
            ),
        }

    return {
        "success": True,
        "event_id": event_id,
        "total_files": total_files,
        "total_batches": total_batches,
        "batch_size": BATCH_SIZE,
        "processed": processed,
        "committed": committed,
        "skipped": skipped,
    }


def _run_process_job(job_id: str, folder_link: str, event_id: str):
    PROCESS_JOBS[job_id] = {
        "job_id": job_id,
        "status": "running",
        "event_id": event_id,
        "started_at": int(time.time()),
        "message": "Job started.",
        "progress": {
            "total_files": 0,
            "total_batches": 0,
            "batch_size": BATCH_SIZE,
            "current_batch": 0,
            "active_batch": 0,
            "scanned_files": 0,
            "processed_embeddings": 0,
            "committed_embeddings": 0,
            "skipped_files": 0,
            "progress_pct": 0,
        },
    }
    try:
        result = _process_drive_folder_impl(folder_link, event_id, job_id=job_id)
        if result.get("success"):
            PROCESS_JOBS[job_id] = {
                **PROCESS_JOBS[job_id],
                "status": "completed",
                "result": result,
                "message": "Processing completed.",
                "finished_at": int(time.time()),
            }
        else:
            PROCESS_JOBS[job_id] = {
                **PROCESS_JOBS[job_id],
                "status": "failed",
                "error": result.get("error", "Unknown error"),
                "result": result,
                "message": "Processing failed.",
                "finished_at": int(time.time()),
            }
    except Exception as e:
        logger.exception("Background processing job failed")
        PROCESS_JOBS[job_id] = {
            **PROCESS_JOBS.get(job_id, {"job_id": job_id, "event_id": event_id}),
            "status": "failed",
            "error": str(e),
            "finished_at": int(time.time()),
        }


def _find_active_job_for_event(event_id: str) -> Optional[str]:
    for jid, job in PROCESS_JOBS.items():
        if job.get("event_id") == event_id and job.get("status") in {"queued", "running"}:
            return jid
    return None


def _find_active_chunk_job_for_event(event_id: str) -> Optional[str]:
    for jid, job in CHUNK_JOBS.items():
        if job.get("event_id") == event_id and job.get("status") in {"active", "running"}:
            return jid
    return None


def _process_files_slice(event_id: str, files_slice: List[dict]) -> Tuple[int, int, int]:
    """
    Process a single chunk of files and commit embeddings for the chunk.
    Returns (processed, skipped, committed).
    """
    processed = 0
    skipped = 0
    committed = 0
    rows: List[dict] = []
    tmpdir = tempfile.mkdtemp()

    try:
        for f in files_slice:
            dest = os.path.join(tmpdir, f["name"])
            try:
                r = requests.get(f["download_url"], stream=True, timeout=60)
                r.raise_for_status()
                with open(dest, "wb") as fp:
                    for chunk in r.iter_content(65536):
                        fp.write(chunk)

                embedding = get_embedding(dest)
                if embedding is None:
                    skipped += 1
                    continue

                rows.append({
                    "event_id": event_id,
                    "filename": f["name"],
                    "file_id": f["id"],
                    "photo_url": f["photo_url"],
                    "embedding": embedding,
                })
                processed += 1
            except Exception as e:
                logger.warning(f"Chunk file processing error ({f.get('name', 'unknown')}): {e}")
                skipped += 1

        if rows:
            sb_insert(EMBEDDINGS_TABLE, rows)
            committed = len(rows)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    return processed, skipped, committed


def _start_process_job(folder_link: str, event_id: str) -> dict:
    active_job_id = _find_active_job_for_event(event_id)
    if active_job_id:
        return {
            "success": True,
            "queued": True,
            "job_id": active_job_id,
            "status": PROCESS_JOBS.get(active_job_id, {}).get("status", "running"),
            "event_id": event_id,
            "message": "A processing job is already running for this event.",
        }

    job_id = str(uuid.uuid4())
    PROCESS_JOBS[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "event_id": event_id,
        "created_at": int(time.time()),
        "message": "Queued for background processing.",
        "progress": {
            "total_files": 0,
            "total_batches": 0,
            "batch_size": BATCH_SIZE,
            "current_batch": 0,
            "active_batch": 0,
            "scanned_files": 0,
            "processed_embeddings": 0,
            "committed_embeddings": 0,
            "skipped_files": 0,
            "progress_pct": 0,
        },
    }

    t = threading.Thread(
        target=_run_process_job,
        args=(job_id, folder_link, event_id),
        daemon=True,
    )
    t.start()

    return {
        "success": True,
        "queued": True,
        "job_id": job_id,
        "status": "queued",
        "event_id": event_id,
        "message": "Processing started in background.",
    }


@app.post("/process-drive-folder")
async def process_drive_folder(data: dict):
    """
    Backwards-compatible endpoint.
    Default behavior now queues a background job to avoid gateway timeouts.
    Send {"sync": true} only when strict synchronous behavior is required.
    """
    folder_link = data.get("folder_link", "")
    event_id = data.get("event_id", "")
    sync_mode = bool(data.get("sync", False))

    if not folder_link or not event_id:
        return {"error": "folder_link and event_id are required"}

    if sync_mode:
        return _process_drive_folder_impl(folder_link, event_id)

    return _start_process_job(folder_link, event_id)


@app.post("/process-drive-folder/start")
async def process_drive_folder_start(data: dict):
    """Start background processing and return job_id immediately."""
    folder_link = data.get("folder_link", "")
    event_id = data.get("event_id", "")
    if not folder_link or not event_id:
        return {"error": "folder_link and event_id are required"}

    return _start_process_job(folder_link, event_id)


@app.get("/process-drive-folder/status/{job_id}")
def process_drive_folder_status(job_id: str):
    job = PROCESS_JOBS.get(job_id)
    if not job:
        return {"error": "job not found", "job_id": job_id}
    return job


@app.post("/process-drive-folder/chunk/start")
async def process_drive_folder_chunk_start(data: dict):
    """
    Start (or resume) a resumable chunk-processing session.
    Each subsequent /chunk/next call processes one chunk only.
    """
    folder_link = data.get("folder_link", "")
    event_id = data.get("event_id", "")
    chunk_size = int(data.get("chunk_size", BATCH_SIZE) or BATCH_SIZE)
    chunk_size = max(1, min(chunk_size, 200))

    if not folder_link or not event_id:
        return {"error": "folder_link and event_id are required"}

    active_job_id = _find_active_chunk_job_for_event(event_id)
    if active_job_id:
        job = CHUNK_JOBS.get(active_job_id, {})
        return {
            "success": True,
            "job_id": active_job_id,
            "event_id": event_id,
            "status": job.get("status", "active"),
            "total_files": job.get("total_files", 0),
            "chunk_size": job.get("chunk_size", chunk_size),
            "next_index": job.get("next_index", 0),
            "message": "Resumed existing chunk session.",
        }

    try:
        folder_id = extract_folder_id(folder_link)
        files = list_drive_images(folder_id)
    except ValueError as e:
        return {"error": str(e)}
    except RuntimeError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to list Drive folder: {e}"}

    if not files:
        return {
            "error": (
                "No images found in the Google Drive folder. "
                "Make sure the folder is public and contains image files."
            )
        }

    try:
        sb_delete(EMBEDDINGS_TABLE, {"event_id": f"eq.{event_id}"})
    except Exception as e:
        return {"error": f"Database error clearing old embeddings: {e}"}

    total_files = len(files)
    total_batches = max(1, (total_files + chunk_size - 1) // chunk_size)
    job_id = str(uuid.uuid4())
    now = int(time.time())
    CHUNK_JOBS[job_id] = {
        "job_id": job_id,
        "status": "active",
        "event_id": event_id,
        "folder_link": folder_link,
        "chunk_size": chunk_size,
        "files": files,
        "total_files": total_files,
        "total_batches": total_batches,
        "next_index": 0,
        "processed": 0,
        "committed": 0,
        "skipped": 0,
        "created_at": now,
        "updated_at": now,
    }

    return {
        "success": True,
        "job_id": job_id,
        "event_id": event_id,
        "status": "active",
        "total_files": total_files,
        "total_batches": total_batches,
        "chunk_size": chunk_size,
        "next_index": 0,
        "message": "Chunk processing session started.",
    }


@app.post("/process-drive-folder/chunk/next")
async def process_drive_folder_chunk_next(data: dict):
    """Process exactly one chunk for a previously started chunk session."""
    job_id = data.get("job_id", "")
    if not job_id:
        return {"error": "job_id is required"}

    job = CHUNK_JOBS.get(job_id)
    if not job:
        return {"error": "chunk job not found", "job_id": job_id}

    if job.get("status") == "completed":
        return {
            "success": True,
            "job_id": job_id,
            "event_id": job.get("event_id"),
            "status": "completed",
            "has_more": False,
            "next_index": job.get("next_index", 0),
            "total_files": job.get("total_files", 0),
            "total_batches": job.get("total_batches", 0),
            "completed_batches": job.get("total_batches", 0),
            "processed": job.get("processed", 0),
            "committed": job.get("committed", 0),
            "skipped": job.get("skipped", 0),
        }

    files = job.get("files", [])
    chunk_size = int(job.get("chunk_size", BATCH_SIZE))
    total_files = int(job.get("total_files", len(files)))
    total_batches = int(job.get("total_batches", max(1, (total_files + chunk_size - 1) // chunk_size)))
    start = int(job.get("next_index", 0))
    end = min(start + chunk_size, total_files)

    if start >= total_files:
        job["status"] = "completed"
        job["files"] = []
        job["updated_at"] = int(time.time())
        CHUNK_JOBS[job_id] = job
        return {
            "success": True,
            "job_id": job_id,
            "event_id": job.get("event_id"),
            "status": "completed",
            "has_more": False,
            "next_index": start,
            "total_files": total_files,
            "total_batches": total_batches,
            "completed_batches": total_batches,
            "processed": job.get("processed", 0),
            "committed": job.get("committed", 0),
            "skipped": job.get("skipped", 0),
        }

    job["status"] = "running"
    job["updated_at"] = int(time.time())
    CHUNK_JOBS[job_id] = job

    files_slice = files[start:end]
    processed_chunk, skipped_chunk, committed_chunk = _process_files_slice(job.get("event_id", ""), files_slice)

    processed_total = int(job.get("processed", 0)) + processed_chunk
    skipped_total = int(job.get("skipped", 0)) + skipped_chunk
    committed_total = int(job.get("committed", 0)) + committed_chunk
    next_index = end
    has_more = next_index < total_files
    completed_batches = (next_index + chunk_size - 1) // chunk_size

    job["processed"] = processed_total
    job["skipped"] = skipped_total
    job["committed"] = committed_total
    job["next_index"] = next_index
    job["status"] = "active" if has_more else "completed"
    job["updated_at"] = int(time.time())
    if not has_more:
        job["files"] = []

    CHUNK_JOBS[job_id] = job

    return {
        "success": True,
        "job_id": job_id,
        "event_id": job.get("event_id"),
        "status": job["status"],
        "has_more": has_more,
        "next_index": next_index,
        "total_files": total_files,
        "chunk_size": chunk_size,
        "total_batches": total_batches,
        "completed_batches": completed_batches,
        "current_batch_processed": processed_chunk,
        "current_batch_skipped": skipped_chunk,
        "processed": processed_total,
        "committed": committed_total,
        "skipped": skipped_total,
        "progress_pct": int((next_index / total_files) * 100) if total_files > 0 else 0,
    }


@app.get("/process-drive-folder/chunk/status/{job_id}")
def process_drive_folder_chunk_status(job_id: str):
    job = CHUNK_JOBS.get(job_id)
    if not job:
        return {"error": "chunk job not found", "job_id": job_id}

    total_files = int(job.get("total_files", 0))
    chunk_size = int(job.get("chunk_size", BATCH_SIZE))
    total_batches = int(job.get("total_batches", max(1, (total_files + chunk_size - 1) // chunk_size)))
    next_index = int(job.get("next_index", 0))
    completed_batches = (next_index + chunk_size - 1) // chunk_size if next_index > 0 else 0

    return {
        "success": True,
        "job_id": job_id,
        "event_id": job.get("event_id"),
        "status": job.get("status", "active"),
        "next_index": next_index,
        "total_files": total_files,
        "chunk_size": chunk_size,
        "total_batches": total_batches,
        "completed_batches": completed_batches,
        "processed": int(job.get("processed", 0)),
        "committed": int(job.get("committed", 0)),
        "skipped": int(job.get("skipped", 0)),
        "progress_pct": int((next_index / total_files) * 100) if total_files > 0 else 0,
        "has_more": next_index < total_files,
        "updated_at": job.get("updated_at"),
    }


@app.post("/match")
async def match_face(
    event_id:  str        = Form(...),
    name:      str        = Form(...),
    mobile:    str        = Form(...),
    file:      UploadFile = File(...),
    threshold: float      = Form(0.35),
):
    """Match an uploaded selfie against all stored face embeddings for an event."""
    contents = await file.read()
    tmpdir   = tempfile.mkdtemp()

    try:
        selfie_path = os.path.join(tmpdir, "selfie.jpg")
        with open(selfie_path, "wb") as f:
            f.write(contents)

        # Get selfie embedding
        selfie_emb = get_embedding(selfie_path)
        if selfie_emb is None:
            return {
                "error": "No face detected in your selfie. Please use a clear, front-facing photo.",
                "matched_photos": [],
            }

        # Load stored embeddings for this event
        docs = sb_select(
            EMBEDDINGS_TABLE,
            {"event_id": f"eq.{event_id}"},
            select="embedding,photo_url,filename,file_id",
        )

        if not docs:
            return {
                "error": (
                    f"No photos have been processed for this event yet. "
                    f"Ask the studio admin to click 'Process Photos' for event '{event_id}' first."
                ),
                "matched_photos": [],
            }

        # Cosine similarity — higher = more similar
        # ArcFace: > 0.35 is typically same person
        matched = []
        for doc in docs:
            stored = doc.get("embedding")
            if not stored:
                continue
            sim = cosine_similarity(selfie_emb, stored)
            if sim >= threshold:
                matched.append({
                    "filename":   doc.get("filename"),
                    "url":        doc.get("photo_url"),
                    "similarity": round(sim, 4),
                })

        matched.sort(key=lambda x: x["similarity"], reverse=True)

        return {
            "success":        True,
            "event_id":       event_id,
            "name":           name,
            "mobile":         mobile,
            "total_checked":  len(docs),
            "matched_count":  len(matched),
            "matched_photos": matched,
        }

    except Exception as e:
        logger.error(f"Match error: {e}")
        return {"error": str(e), "matched_photos": []}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.post("/debug-scores")
async def debug_scores(
    event_id: str        = Form(...),
    file:     UploadFile = File(...),
):
    """Returns similarity scores for ALL photos in an event (for threshold tuning)."""
    contents = await file.read()
    tmpdir   = tempfile.mkdtemp()
    try:
        img_path = os.path.join(tmpdir, "selfie.jpg")
        with open(img_path, "wb") as f:
            f.write(contents)

        selfie_emb = get_embedding(img_path)
        if selfie_emb is None:
            return {"error": "No face detected"}

        docs = sb_select(
            EMBEDDINGS_TABLE,
            {"event_id": f"eq.{event_id}"},
            select="embedding,photo_url,filename",
        )

        scores = []
        for doc in docs:
            emb = doc.get("embedding")
            if emb:
                sim = cosine_similarity(selfie_emb, emb)
                scores.append({
                    "filename":   doc.get("filename"),
                    "similarity": round(sim, 4),
                    "url":        doc.get("photo_url"),
                })

        scores.sort(key=lambda x: x["similarity"], reverse=True)
        return {"event_id": event_id, "total": len(scores), "scores": scores}
    except Exception as e:
        return {"error": str(e)}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.post("/cleanup-low-confidence")
async def cleanup(data: dict):
    return {"message": "Not needed in this version"}
