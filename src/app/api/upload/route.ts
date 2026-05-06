import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventCode = formData.get("eventCode") as string | null;

    if (!file || !eventCode) {
      return NextResponse.json(
        { error: "Missing file or eventCode" },
        { status: 400 }
      );
    }

    // Convert File to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `findmyshot/${eventCode}`,
            resource_type: "image",
            transformation: [
              { fetch_format: "auto", quality: "auto" },
              { width: 1920, crop: "limit" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result as CloudinaryUploadResult);
            else reject(new Error("No result from Cloudinary"));
          }
        );
        uploadStream.end(buffer);
      }
    );

    // Call Python backend to process face embeddings
    const backendUrl = process.env.BACKEND_URL;
    let facesFound = 0;
    let processingJobId: string | null = null;

    if (backendUrl) {
      try {
        const processPath = process.env.ASYNC_FACE_PROCESSING === "true"
          ? "/process-photo/async"
          : "/process-photo";
        const processResponse = await fetch(`${backendUrl}${processPath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cloudinaryUrl: uploadResult.secure_url,
            eventCode,
            cloudinaryId: uploadResult.public_id,
            filename: file.name,
          }),
        });

        if (processResponse.ok) {
          const processData = await processResponse.json();
          facesFound = processData.facesFound || 0;
          processingJobId = processData.jobId ?? null;
        }
      } catch {
        // Face processing failed but photo was uploaded — still return success
        facesFound = -1;
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      facesFound,
      processingJobId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
