import os

from fastapi import APIRouter
from pymongo import MongoClient


router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz():
    mongo_ok = False
    mongo_error = None
    try:
        mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
        client = MongoClient(mongo_uri)
        client.admin.command("ping")
        mongo_ok = True
    except Exception as exc:
        mongo_error = str(exc)

    cloudinary_configured = bool(
        os.getenv("CLOUDINARY_CLOUD_NAME")
        and os.getenv("CLOUDINARY_API_KEY")
        and os.getenv("CLOUDINARY_API_SECRET")
    )
    return {
        "status": "ok" if mongo_ok else "degraded",
        "mongo": {"ok": mongo_ok, "error": mongo_error},
        "cloudinaryConfigured": cloudinary_configured,
    }
