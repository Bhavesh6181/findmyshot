from deepface import DeepFace
import cloudinary, cloudinary.uploader
from db import save_event_photo
import os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def process_and_upload(image_path: str, event_id: str):
    # Cloudinary pe upload
    result = cloudinary.uploader.upload(image_path)
    url = result["secure_url"]
    cid = result["public_id"]

    # Sabke embeddings nikalo
    try:
        faces = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet512",
            enforce_detection=False
        )
        embeddings = [f["embedding"] for f in faces]
    except:
        embeddings = []

    save_event_photo(event_id, url, cid, embeddings)
    print(f"Done: {image_path} — {len(embeddings)} faces found")

# Usage:
# python upload_photos.py
if __name__ == "__main__":
    event = "PICT25"
    folder = "./event_photos"  # apne photos yahan daalo
    for f in os.listdir(folder):
        if f.endswith((".jpg", ".jpeg", ".png")):
            process_and_upload(os.path.join(folder, f), event)