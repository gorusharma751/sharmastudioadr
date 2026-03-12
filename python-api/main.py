import os
import re
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional, List, Dict

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


@app.post("/process-drive-folder")
async def process_drive_folder(data: dict):
    """
    Download all images from a public Google Drive folder,
    generate face embeddings, and store them in MongoDB.
    """
    folder_link = data.get("folder_link", "")
    event_id    = data.get("event_id", "")

    if not folder_link or not event_id:
        return {"error": "folder_link and event_id are required"}

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

    # 3. Clear old embeddings for this event, then process
    try:
        sb_delete(EMBEDDINGS_TABLE, {"event_id": f"eq.{event_id}"})
        logger.info(f"Cleared old embeddings for event '{event_id}'")
    except Exception as e:
        return {"error": f"Database error clearing old embeddings: {e}"}

    processed = 0
    skipped   = 0
    tmpdir    = tempfile.mkdtemp()
    batch: List[dict] = []

    try:
        for i, f in enumerate(files):
            logger.info(f"[{i+1}/{len(files)}] {f['name']}")
            dest = os.path.join(tmpdir, f["name"])

            try:
                r = requests.get(f["download_url"], stream=True, timeout=60)
                r.raise_for_status()
                with open(dest, "wb") as fp:
                    for chunk in r.iter_content(65536):
                        fp.write(chunk)

                embedding = get_embedding(dest)

                if embedding is None:
                    logger.info(f"  → No face detected, skipping")
                    skipped += 1
                    continue

                batch.append({
                    "event_id":  event_id,
                    "filename":  f["name"],
                    "file_id":   f["id"],
                    "photo_url": f["photo_url"],
                    "embedding": embedding,
                })
                processed += 1
                logger.info(f"  → Embedded ✓")

                # Flush every 50 records to avoid oversized requests
                if len(batch) >= 50:
                    sb_insert(EMBEDDINGS_TABLE, batch)
                    batch = []

            except Exception as e:
                logger.warning(f"  → Error: {e}")
                skipped += 1

        # Flush remaining records
        if batch:
            sb_insert(EMBEDDINGS_TABLE, batch)

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    return {
        "success":     True,
        "event_id":    event_id,
        "total_files": len(files),
        "processed":   processed,
        "skipped":     skipped,
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
