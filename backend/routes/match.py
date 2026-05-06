from fastapi import APIRouter, HTTPException

from db import get_event_photos
from services.processing import match_selfie


router = APIRouter(tags=["match"])


@router.post("/match")
async def match_photos(req: dict):
    try:
        selfie_base64 = req.get("selfieBase64")
        event_id = req.get("eventId")
        if not selfie_base64 or not event_id:
            raise HTTPException(status_code=400, detail="Missing selfieBase64 or eventId")

        matches = match_selfie(selfie_base64, event_id)
        total_scanned = len(get_event_photos(event_id))
        return {"photos": matches, "totalScanned": total_scanned}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
