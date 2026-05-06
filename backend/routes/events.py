from fastapi import APIRouter, Depends, HTTPException, Request
import cloudinary.uploader

from db import get_all_events, create_event, get_event_detail, delete_event as delete_event_db
from services.rate_limit import enforce_write_rate_limit


router = APIRouter(tags=["events"])


@router.get("/events")
async def list_events(skip: int = 0, limit: int = 100):
    try:
        return {"events": get_all_events(skip=skip, limit=limit)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/events", dependencies=[Depends(enforce_write_rate_limit)])
async def add_event(payload: dict, request: Request):
    try:
        name = payload.get("name")
        code = payload.get("code")
        if not name or not code:
            raise HTTPException(status_code=400, detail="Missing name or code")
        event = create_event(name, code)
        return {"success": True, "event": event, "requestId": getattr(request.state, "request_id", None)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/events/{code}")
async def get_event(code: str):
    event = get_event_detail(code)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"event": event}


@router.delete("/events/{code}", dependencies=[Depends(enforce_write_rate_limit)])
async def delete_event_endpoint(code: str):
    ids = delete_event_db(code)
    deleted = 0
    for cid in ids:
        try:
            cloudinary.uploader.destroy(cid)
            deleted += 1
        except Exception:
            pass
    return {"success": True, "deletedPhotos": deleted}
