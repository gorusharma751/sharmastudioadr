import os
import re
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional, List

import numpy as np
import requests
import face_recognition
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Config from Environment Variables ────────────────────────────────────────
MONGODB_URI    = os.environ.get("MONGODB_URI", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
DB_NAME        = "deepface_db"
COLLECTION     = "face_embeddings"

# face_recognition distance threshold — lower = stricter
# 0.45 is strict, 0.55 is standard, 0.65 is loose
MATCH_DISTANCE = float(os.environ.get("MATCH_DISTANCE", "0.55"))

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="DeepFace API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB helpers ──────────────────────────────────────────────────────────
def get_col():
    """Return (collection, client). Caller must close client."""
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=12000)
    return client[DB_NAME][COLLECTION], client

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
def get_encoding(image_path: str) -> Optional[List[float]]:
    """Extract 128-dim face encoding. Returns None if no face found."""
    try:
        img = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(img)
        if encodings:
            return encodings[0].tolist()
    except Exception as e:
        logger.debug(f"No face in {image_path}: {e}")
    return None


def face_distance(a: List[float], b: List[float]) -> float:
    """L2 distance between two face encodings. < 0.55 = same person."""
    return float(np.linalg.norm(np.array(a, dtype=np.float32) - np.array(b, dtype=np.float32)))


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"status": "DeepFace API running ✅"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/test-db")
def test_db():
    """Test MongoDB Atlas connection."""
    if not MONGODB_URI:
        return {"error": "MONGODB_URI environment variable is not set"}
    try:
        col, client = get_col()
        client.admin.command("ping")
        total = col.count_documents({})
        client.close()
        return {"status": "connected", "total_embeddings": total}
    except Exception as e:
        return {"error": str(e)}


@app.get("/event-stats/{event_id}")
def event_stats(event_id: str):
    """How many face embeddings are stored for this event."""
    try:
        col, client = get_col()
        total = col.count_documents({"event_id": event_id})
        client.close()
        return {"event_id": event_id, "total_photos": total}
    except Exception as e:
        return {"error": str(e)}


@app.get("/processing-status/{event_id}")
def processing_status(event_id: str):
    try:
        col, client = get_col()
        total = col.count_documents({"event_id": event_id})
        client.close()
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

    # 3. Connect to MongoDB and remove old embeddings
    try:
        col, client = get_col()
    except Exception as e:
        return {"error": f"MongoDB connection failed: {e}"}

    deleted = col.delete_many({"event_id": event_id}).deleted_count
    logger.info(f"Removed {deleted} old embeddings for event '{event_id}'")

    processed = 0
    skipped   = 0
    tmpdir    = tempfile.mkdtemp()

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

                encoding = get_encoding(dest)

                if encoding is None:
                    logger.info(f"  → No face detected, skipping")
                    skipped += 1
                    continue

                col.insert_one({
                    "event_id":  event_id,
                    "filename":  f["name"],
                    "file_id":   f["id"],
                    "photo_url": f["photo_url"],
                    "embedding": encoding,
                })
                processed += 1
                logger.info(f"  → Embedded ✓")

            except Exception as e:
                logger.warning(f"  → Error: {e}")
                skipped += 1

    finally:
        client.close()
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
    threshold: float      = Form(0.55),
):
    """Match an uploaded selfie against all stored face embeddings for an event."""
    contents = await file.read()
    tmpdir   = tempfile.mkdtemp()

    try:
        selfie_path = os.path.join(tmpdir, "selfie.jpg")
        with open(selfie_path, "wb") as f:
            f.write(contents)

        # Get selfie encoding
        selfie_enc = get_encoding(selfie_path)
        if selfie_enc is None:
            return {
                "error": "No face detected in your selfie. Please use a clear, front-facing photo.",
                "matched_photos": [],
            }

        # Load stored embeddings for this event
        col, client = get_col()
        docs = list(col.find({"event_id": event_id}))
        client.close()

        if not docs:
            return {
                "error": (
                    f"No photos have been processed for this event yet. "
                    f"Ask the studio admin to click 'Process Photos' for event '{event_id}' first."
                ),
                "matched_photos": [],
            }

        # Compare using L2 distance — lower = more similar
        # Default tolerance in face_recognition library is 0.6
        dist_threshold = threshold  # use passed threshold as max distance
        matched = []
        for doc in docs:
            stored = doc.get("embedding")
            if not stored:
                continue
            dist = face_distance(selfie_enc, stored)
            if dist <= dist_threshold:
                matched.append({
                    "filename":   doc.get("filename"),
                    "url":        doc.get("photo_url"),
                    "similarity": round(max(0.0, 1.0 - dist), 4),
                    "distance":   round(dist, 4),
                })

        matched.sort(key=lambda x: x["distance"])

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
    """Returns distance scores for ALL photos in an event (for debugging threshold)."""
    contents = await file.read()
    tmpdir   = tempfile.mkdtemp()
    try:
        img_path = os.path.join(tmpdir, "selfie.jpg")
        with open(img_path, "wb") as f:
            f.write(contents)

        selfie_enc = get_encoding(img_path)
        if selfie_enc is None:
            return {"error": "No face detected"}

        col, client = get_col()
        docs = list(col.find({"event_id": event_id}))
        client.close()

        scores = []
        for doc in docs:
            emb = doc.get("embedding")
            if emb:
                dist = face_distance(selfie_enc, emb)
                scores.append({
                    "filename":   doc.get("filename"),
                    "distance":   round(dist, 4),
                    "similarity": round(max(0.0, 1.0 - dist), 4),
                    "url":        doc.get("photo_url"),
                })

        scores.sort(key=lambda x: x["distance"])
        return {"event_id": event_id, "total": len(scores), "scores": scores}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.post("/cleanup-low-confidence")
async def cleanup(data: dict):
    return {"message": "Not needed in this version"}
