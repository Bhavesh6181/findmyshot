"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CameraFrame from "@/components/ui/CameraFrame";
import GoldButton from "@/components/ui/GoldButton";
import GhostButton from "@/components/ui/GhostButton";
import { useAppContext } from "@/context/AppContext";

type CameraState = "idle" | "streaming" | "captured" | "error";

export default function ScanSelfiePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { selectedEvent, selectedEventName, setUserSelfie } = useAppContext();

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("streaming");
      }
    } catch {
      setCameraState("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      router.replace("/scan");
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [router, selectedEvent, startCamera, stopCamera]);

  const onImageReady = (base64: string) => {
    setCapturedImage(base64);
    setCameraState("captured");
    stopCamera();
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    onImageReady(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageReady(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!capturedImage || !selectedEvent) return;
    setUserSelfie(capturedImage);
    router.push(`/gallery?event=${encodeURIComponent(selectedEvent)}`);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraState("idle");
    startCamera();
  };

  return (
    <main className="page-transition flex min-h-screen flex-col items-center bg-void px-4 py-8 md:px-6 md:py-12">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.push("/scan")}
          className="mb-2 text-sm text-muted hover:text-ivory"
        >
          ← Events
        </button>
        <p className="mb-4 text-center text-[11px] uppercase tracking-widest text-gold">
          Finding photos from: {selectedEventName ?? selectedEvent}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <CameraFrame size={250}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              cameraState === "captured" || cameraState === "error" ? "hidden" : "block"
            }`}
            style={{ transform: "scaleX(-1)" }}
          />
          {cameraState === "captured" && capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImage} alt="Selfie preview" className="h-full w-full object-cover" />
          )}
          {cameraState === "error" && (
            <div className="flex h-full w-full items-center justify-center bg-surface p-4 text-xs text-muted">
              Camera access denied. Upload a photo instead.
            </div>
          )}
        </CameraFrame>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        {cameraState === "captured" ? (
          <div className="flex w-full flex-col gap-3">
            <GoldButton fullWidth onClick={handleConfirm}>
              Confirm & Find Photos
            </GoldButton>
            <GhostButton fullWidth onClick={handleRetake}>
              Retake
            </GhostButton>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <GoldButton fullWidth onClick={handleCapture} disabled={cameraState !== "streaming"}>
              Take Selfie
            </GoldButton>
            <GhostButton fullWidth onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </GhostButton>
          </div>
        )}
      </div>
    </main>
  );
}
