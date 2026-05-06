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

type Params = { params: { code: string } };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `findmyshot/${params.code}`,
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
    });

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
            eventCode: params.code,
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
        facesFound = -1;
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      filename: file.name,
      facesFound,
      processingJobId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Add photo failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
