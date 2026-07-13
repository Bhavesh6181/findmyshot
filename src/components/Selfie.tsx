import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SelfieProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
  selectedEventCode: string;
  selectedEventName: string;
  onSetSelfie: (base64: string) => void;
}

export default function Selfie({ onNavigate, selectedEventCode, selectedEventName, onSetSelfie }: SelfieProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<'idle' | 'streaming' | 'captured' | 'error'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraState('idle');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load to ensure dimensions are ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraState('streaming');
          }).catch(err => {
            console.error("Video play failed:", err);
            setCameraState('error');
          });
        };
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraState('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Draw square crop from video feed
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mirror image for natural selfie feel
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(base64);
    setCameraState('captured');
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        setCameraState('captured');
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    onSetSelfie(capturedImage);
    onNavigate('gallery');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col items-center">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-margin-mobile h-16 md:px-margin-desktop">
        <div className="flex items-center gap-unit-md">
          <button 
            onClick={() => onNavigate('events')}
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-150"
          >
            arrow_back
          </button>
          <div className="flex items-center gap-unit-xs">
            <span className="material-symbols-outlined text-primary">camera_front</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-on-surface-variant font-bold">Event: {selectedEventName || selectedEventCode}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[600px] flex flex-col items-center justify-center pt-24 pb-32 px-margin-mobile">
        {/* Header Text */}
        <div className="text-center mb-unit-xl">
          <h2 className="font-headline-lg text-2xl font-extrabold text-primary mb-2">Check Your Photo</h2>
          <p className="font-body-md text-on-surface-variant max-w-xs mx-auto">Make sure your face is clearly visible so the AI can match your profile.</p>
        </div>

        {/* Large Circular Preview */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-unit-lg">
          {/* Animated high-tech scanning ring */}
          <div className={`absolute inset-0 rounded-full border-4 ${cameraState === 'streaming' ? 'border-brand-gold animate-pulse' : 'border-surface-container-high'} shadow-xl overflow-hidden shimmer-border transition-colors duration-300`}>
            <div className="absolute inset-[4px] bg-surface rounded-full z-10 flex items-center justify-center overflow-hidden">
              
              {/* Webcam stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${cameraState === 'captured' || cameraState === 'error' ? 'hidden' : 'block'}`}
              />

              {/* Static Captured Image */}
              {cameraState === 'captured' && capturedImage && (
                <img className="w-full h-full object-cover" alt="Captured selfie" src={capturedImage} />
              )}

              {/* Fallback Camera loading or error */}
              {(cameraState === 'idle' || cameraState === 'error') && (
                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center text-xs text-on-surface-variant z-20">
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline">photo_camera</span>
                  {cameraState === 'idle' ? 'Opening webcam...' : 'Webcam blocked. Please upload a selfie photo below.'}
                </div>
              )}
            </div>
          </div>
          
          {/* Scanline overlay effect */}
          {cameraState === 'streaming' && (
            <div className="absolute inset-[4px] rounded-full z-20 pointer-events-none overflow-hidden opacity-20">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-gold to-transparent h-24 -top-24 animate-scan"></div>
            </div>
          )}
        </div>

        {/* Hidden helpers */}
        <canvas ref={canvasRef} className="hidden" />
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Action Buttons */}
        <div className="w-full space-y-3 px-6">
          {cameraState === 'streaming' && (
            <button 
              onClick={handleCapture}
              className="w-full bg-secondary-container text-on-secondary-container font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 active:scale-95 duration-150 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Take Selfie
            </button>
          )}

          {cameraState === 'captured' && (
            <>
              <button 
                onClick={handleConfirm}
                className="w-full bg-secondary-container text-on-secondary-container font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 active:scale-95 duration-150 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Find My Photos
              </button>
              <button 
                onClick={handleRetake}
                className="w-full bg-transparent border-2 border-primary text-primary font-bold py-4 rounded-xl hover:bg-surface-container-low active:scale-95 duration-150 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                Retake
              </button>
            </>
          )}

          {cameraState !== 'captured' && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-transparent text-primary font-bold py-3 rounded-xl hover:bg-surface-container-low active:scale-95 duration-150 transition-all flex items-center justify-center gap-2 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined">upload</span>
              Upload Photo Instead
            </button>
          )}
        </div>

        {/* Info Hint */}
        <div className="mt-8 bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 flex items-start gap-3 w-full max-w-sm">
          <span className="material-symbols-outlined text-brand-gold shrink-0">info</span>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Our facial recognition processing scans your features dynamically to secure and match your profile. No images are stored on our servers.
          </p>
        </div>
      </main>
    </div>
  );
}
