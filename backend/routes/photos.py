from fastapi import APIRouter, Depends
import cloudinary.uploader

from db import delete_photo_from_event
from services.rate_limit import enforce_write_rate_limit
from services.processing import process_photo_sync, enqueue_photo_processing, get_job


router = APIRouter(tags=["photos"])


@router.post("/process-photo", dependencies=[Depends(enforce_write_rate_limit)])
async def process_photo(req: dict):
    result = process_photo_sync(
        cloudinary_url=req["cloudinaryUrl"],
        event_code=req["eventCode"],
        cloudinary_id=req["cloudinaryId"],
        filename=req.get("filename", ""),
    )
    return result


@router.post("/process-photo/async", dependencies=[Depends(enforce_write_rate_limit)])
async def process_photo_async(req: dict):
    job_id = enqueue_photo_processing(
        cloudinary_url=req["cloudinaryUrl"],
        event_code=req["eventCode"],
        cloudinary_id=req["cloudinaryId"],
        filename=req.get("filename", ""),
    )
    return {"success": True, "jobId": job_id}


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        return {"found": False}
    return {"found": True, **job}


@router.delete("/photos/{cloudinary_id}", dependencies=[Depends(enforce_write_rate_limit)])
async def delete_photo(cloudinary_id: str):
    try:
        cloudinary.uploader.destroy(cloudinary_id)
    except Exception:
        pass
    delete_photo_from_event(cloudinary_id)
    return {"success": True}
