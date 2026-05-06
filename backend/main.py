from dotenv import load_dotenv

load_dotenv()

import os

import cloudinary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pymongo import MongoClient

from db import ensure_indexes
from routes.events import router as events_router
from routes.health import router as health_router
from routes.match import router as match_router
from routes.photos import router as photos_router
from services.observability import RequestLoggingMiddleware


app = FastAPI()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


@app.on_event("startup")
async def startup_db_check():
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        client.admin.command("ping")
        ensure_indexes()
        print("MongoDB Atlas connected successfully.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")


app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3003").split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.get("/")
def root():
    return {"status": "FindMyShot backend running"}


app.include_router(health_router)
app.include_router(events_router)
app.include_router(photos_router)
app.include_router(match_router)
