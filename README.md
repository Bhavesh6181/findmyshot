# FindMyShot

A mobile-first photo finding app using face recognition. Photographers upload event photos, attendees upload a selfie to find all photos of themselves.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Auth**: NextAuth v5 (Auth.js) with Google OAuth + MongoDB adapter
- **Backend**: Python FastAPI, DeepFace (Facenet512), MongoDB
- **Storage**: Cloudinary (photos), MongoDB Atlas (data + embeddings)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Cloudinary account
- Google Cloud Console project

### Frontend Setup

```bash
cd findmyshot
npm install
```

Create `.env.local`:
```
BACKEND_URL=http://localhost:8000
MONGODB_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
AUTH_SECRET=openssl_rand_base64_32
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3003
PHOTOGRAPHER_EMAILS=photographer1@gmail.com,photographer2@gmail.com
```

```bash
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `.env`:
```
MONGO_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
uvicorn main:app --reload --port 8000
```

## Deployment

### Vercel (Frontend)

Environment variables to add in Vercel Dashboard:
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `MONGODB_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PHOTOGRAPHER_EMAILS`
- `NEXT_PUBLIC_APP_URL` (set to `https://yourapp.vercel.app`)
- `BACKEND_URL` (set to your Render backend URL)

### Render (Python Backend)

Environment variables to add in Render Dashboard:
- `MONGO_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ALLOWED_ORIGINS` (e.g. `http://localhost:3003,https://your-frontend.vercel.app`)

## Production Notes

- Frontend serves optimized image formats (`AVIF/WebP`) and compression is enabled.
- Backend enables GZip compression for larger API responses.
- MongoDB indexes are auto-created on startup for event code and photo ID lookups.
- Public events endpoint is cached (`s-maxage`) to reduce repeated DB reads.
- Cloudinary uploads use automatic quality/format transformation for faster delivery.
- Backend now exposes `GET /healthz` for deployment health checks.
- Render config uses `gunicorn + uvicorn worker` for better process management.
- Structured JSON request logs include `x-request-id` (also returned in response header).
- Write APIs (`POST`/`DELETE`/processing) are rate-limited per IP.
- Optional async face processing queue:
  - Set `ASYNC_FACE_PROCESSING=true` (frontend env) to enqueue jobs.
  - Track status via backend `GET /jobs/{job_id}`.

## User Roles

- **Photographer**: Email is in `PHOTOGRAPHER_EMAILS` env variable → access to `/photographer` dashboard
- **User**: Everyone else → selfie upload at `/scan` → photo results at `/gallery`
