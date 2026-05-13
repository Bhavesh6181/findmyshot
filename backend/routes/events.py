from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError
import cloudinary.uploader
import logging

from db import get_all_events, create_event, get_event_detail, delete_event as delete_event_db
from services.rate_limit import enforce_write_rate_limit

logger = logging.getLogger("findmyshot")

router = APIRouter(tags=["events"])


class CreateEventBody(BaseModel):
    """JSON body must be bound explicitly; bare `dict` params do not reliably read the request body."""

    name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1, max_length=8, pattern=r"^[A-Za-z0-9]+$")


@router.get("/events")
async def list_events(skip: int = 0, limit: int = 100):
    try:
        return {"events": get_all_events(skip=skip, limit=limit)}
    except Exception as exc:
        logger.error(f"[GET /events] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/events", dependencies=[Depends(enforce_write_rate_limit)])
async def add_event(body: CreateEventBody, request: Request):
    logger.info(f"[POST /events] Received body: name={body.name!r}, code={body.code!r}")
    try:
        name = body.name.strip()
        code = body.code.strip().upper()
        if not name or not code:
            raise HTTPException(status_code=400, detail="Missing name or code")
        event = create_event(name, code)
        logger.info(f"[POST /events] Created event: {event}")
        return {"success": True, "event": event, "requestId": getattr(request.state, "request_id", None)}
    except ValueError as exc:
        # Duplicate event code or other business logic error
        logger.warning(f"[POST /events] ValueError: {exc}")
        raise HTTPException(status_code=409, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[POST /events] Unexpected error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


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

