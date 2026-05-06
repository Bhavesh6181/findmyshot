import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from threading import Lock

import httpx

from db import save_event_photo
from face_match import get_embedding, find_matches, get_face_embeddings


EXECUTOR = ThreadPoolExecutor(max_workers=max(2, int(os.getenv("PROCESSING_WORKERS", "4"))))
JOBS = {}
JOBS_LOCK = Lock()


def _set_job(job_id: str, payload: dict):
    with JOBS_LOCK:
        JOBS[job_id] = {**JOBS.get(job_id, {}), **payload}


def process_photo_sync(cloudinary_url: str, event_code: str, cloudinary_id: str, filename: str = "") -> dict:
    temp_path = None
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(cloudinary_url)
            response.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(response.content)
            temp_path = tmp.name

        try:
            embeddings = get_face_embeddings(temp_path)
        except Exception:
            embeddings = []

        save_event_photo(event_code, cloudinary_url, cloudinary_id, embeddings, filename)
        return {
            "success": True,
            "facesFound": len(embeddings),
            "url": cloudinary_url,
            "cloudinaryId": cloudinary_id,
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def enqueue_photo_processing(cloudinary_url: str, event_code: str, cloudinary_id: str, filename: str = "") -> str:
    job_id = str(uuid.uuid4())
    _set_job(
        job_id,
        {
            "id": job_id,
            "status": "queued",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        },
    )

    def _worker():
        _set_job(job_id, {"status": "running"})
        try:
            result = process_photo_sync(cloudinary_url, event_code, cloudinary_id, filename)
            _set_job(job_id, {"status": "completed", "result": result})
        except Exception as exc:
            _set_job(job_id, {"status": "failed", "error": str(exc)})

    EXECUTOR.submit(_worker)
    return job_id


def get_job(job_id: str):
    with JOBS_LOCK:
        return JOBS.get(job_id)


def match_selfie(selfie_base64: str, event_id: str):
    import base64

    selfie_path = "temp_selfie.jpg"
    with open(selfie_path, "wb") as f:
        f.write(base64.b64decode(selfie_base64.split(",")[-1]))
    try:
        embedding = get_embedding(selfie_path)
        return find_matches(embedding, event_id)
    finally:
        if os.path.exists(selfie_path):
            os.remove(selfie_path)
