import cv2
import numpy as np
from insightface.app import FaceAnalysis

from db import get_event_photos

print("Loading InsightFace model (buffalo_sc)...")
app_model = FaceAnalysis(
    name="buffalo_sc",
    providers=["CPUExecutionProvider"],
)
app_model.prepare(ctx_id=-1, det_size=(320, 320))
print("InsightFace model ready")


def get_embedding(img_path: str):
    img = cv2.imread(img_path)
    if img is None:
        return None
    faces = app_model.get(img)
    if not faces:
        return None
    return faces[0].embedding.tolist()


def get_face_embeddings(img_path: str):
    img = cv2.imread(img_path)
    if img is None:
        return []
    faces = app_model.get(img)
    return [face.embedding.tolist() for face in faces]


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def find_matches(user_embedding, event_id: str, threshold=0.4):
    if not user_embedding:
        return []

    photos = get_event_photos(event_id)
    matches = []

    for photo in photos:
        for face_emb in photo.get("face_embeddings", []):
            score = cosine_similarity(user_embedding, face_emb)
            if score >= threshold:
                matches.append(
                    {
                        "url": photo["cloudinary_url"],
                        "cloudinaryId": photo["cloudinary_id"],
                        "confidence": round(score, 2),
                    }
                )
                break

    return sorted(matches, key=lambda x: x["confidence"], reverse=True)