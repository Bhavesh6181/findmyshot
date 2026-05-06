from deepface import DeepFace
from db import get_event_photos
import numpy as np

print("Loading Facenet512 model...")
DeepFace.build_model("Facenet512")
print("Model ready")

def get_embedding(img_path: str):
    result = DeepFace.represent(
        img_path=img_path,
        model_name="Facenet512",
        enforce_detection=False
    )
    return result[0]["embedding"]

def get_face_embeddings(img_path: str):
    result = DeepFace.represent(
        img_path=img_path,
        model_name="Facenet512",
        enforce_detection=False
    )
    return [face["embedding"] for face in result]

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def find_matches(user_embedding, event_id: str, threshold=0.7):
    photos = get_event_photos(event_id)
    matches = []

    for photo in photos:
        for face_emb in photo.get("face_embeddings", []):
            score = cosine_similarity(user_embedding, face_emb)
            if score >= threshold:
                matches.append({
                    "url": photo["cloudinary_url"],
                    "cloudinaryId": photo["cloudinary_id"],
                    "confidence": round(float(score), 2)
                })
                break  # ek match mila, next photo

    matches.sort(key=lambda x: x["confidence"], reverse=True)
    return matches