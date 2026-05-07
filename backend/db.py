from dotenv import load_dotenv
import os
from datetime import datetime, timezone
from pymongo import ASCENDING
from pymongo import MongoClient

load_dotenv()

# Support both backend and frontend naming to avoid deployment misconfig errors.
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("Mongo URI not found. Set MONGO_URI or MONGODB_URI.")

client = MongoClient(MONGO_URI)
db = client["findmyshot"]

def ensure_indexes():
    db.events.create_index([("code", ASCENDING)], unique=True, name="idx_event_code_unique")
    db.events.create_index([("photos.cloudinary_id", ASCENDING)], name="idx_photo_cloudinary_id")
    db.events.create_index([("updatedAt", ASCENDING)], name="idx_event_updated_at")

def get_event_photos(event_id: str):
    event = db.events.find_one({"code": event_id}, {"photos": 1, "_id": 0})
    if not event:
        return []
    return event.get("photos", [])

def save_event_photo(event_id: str, cloudinary_url: str, 
                     cloudinary_id: str, embeddings: list, filename: str = ""):
    db.events.update_one(
        {"code": event_id},
        {
            "$set": {"updatedAt": datetime.now(timezone.utc)},
            "$push": {"photos": {
                "cloudinary_url": cloudinary_url,
                "cloudinary_id": cloudinary_id,
                "face_embeddings": embeddings,
                "filename": filename,
                "uploadedAt": datetime.now(timezone.utc),
            }}
        },
        upsert=True
    )

def get_all_events(skip: int = 0, limit: int = 100):
    """Return all events with name, code, and photo count + updated date."""
    pipeline = [
        {"$sort": {"updatedAt": -1, "createdAt": -1}},
        {"$skip": max(0, skip)},
        {"$limit": max(1, min(limit, 200))},
        {
            "$project": {
                "_id": 0,
                "name": {"$ifNull": ["$name", "$code"]},
                "code": "$code",
                "photoCount": {"$size": {"$ifNull": ["$photos", []]}},
                "createdAt": "$createdAt",
                "updatedAt": {"$ifNull": ["$updatedAt", "$createdAt"]},
            }
        },
    ]
    result = list(db.events.aggregate(pipeline))
    for e in result:
        if e.get("createdAt"):
            e["createdAt"] = e["createdAt"].isoformat()
        if e.get("updatedAt"):
            e["updatedAt"] = e["updatedAt"].isoformat()
    return result

def create_event(name: str, code: str):
    """Create a new event. Returns the created event info."""
    existing = db.events.find_one({"code": code})
    if existing:
        raise ValueError(f"Event with code '{code}' already exists")
    
    db.events.insert_one({
        "name": name,
        "code": code,
        "photos": [],
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    })
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "name": name,
        "code": code,
        "photoCount": 0,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }

def get_event_detail(code: str):
    event = db.events.find_one({"code": code}, {"_id": 0, "photos.face_embeddings": 0})
    if not event:
        return None

    photos = [{
        "cloudinary_url": p.get("cloudinary_url", ""),
        "cloudinary_id": p.get("cloudinary_id", ""),
        "filename": p.get("filename", ""),
        "facesFound": len(p.get("face_embeddings", [])),
        "uploadedAt": p.get("uploadedAt").isoformat() if p.get("uploadedAt") else None,
    } for p in event.get("photos", [])]

    return {
        "name": event.get("name", code),
        "code": code,
        "createdAt": event.get("createdAt").isoformat() if event.get("createdAt") else None,
        "updatedAt": event.get("updatedAt").isoformat() if event.get("updatedAt") else None,
        "photoCount": len(photos),
        "photos": photos,
    }

def delete_photo_from_event(cloudinary_id: str):
    db.events.update_one(
        {"photos.cloudinary_id": cloudinary_id},
        {
            "$set": {"updatedAt": datetime.now(timezone.utc)},
            "$pull": {"photos": {"cloudinary_id": cloudinary_id}},
        },
    )

def delete_event(code: str):
    event = db.events.find_one({"code": code}, {"photos.cloudinary_id": 1})
    if event:
        ids = [p.get("cloudinary_id") for p in event.get("photos", []) if p.get("cloudinary_id")]
        db.events.delete_one({"code": code})
        return ids
    return []