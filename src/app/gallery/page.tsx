"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GoldButton from "@/components/ui/GoldButton";
import GhostButton from "@/components/ui/GhostButton";
import { useAppContext } from "@/context/AppContext";
import { MatchedPhoto } from "@/types";

const loadingTexts = ["Scanning event photos...", "Comparing faces...", "Finding your moments..."];

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userSelfie, matchedPhotos, setMatchedPhotos, selectedEventName } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [currentLoadingText, setCurrentLoadingText] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const eventCode = searchParams.get("event");

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentLoadingText((prev) => (prev + 1) % loadingTexts.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchMatches() {
  if (!userSelfie || !eventCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selfieBase64: userSelfie, eventCode }),
        });

        if (!response.ok) {
          throw new Error("Failed to find matching photos");
        }

        const data = await response.json();
        setMatchedPhotos(data.photos || []);
        setTotalScanned(Number(data.totalScanned ?? 0));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, [userSelfie, eventCode, setMatchedPhotos]);

  const handleDownloadSingle = useCallback(async (photo: MatchedPhoto) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `findmyshot-${photo.cloudinaryId}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle download errors
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (matchedPhotos.length === 0) return;

    setDownloadingAll(true);
    try {
      // Dynamically import JSZip only when needed
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const downloadPromises = matchedPhotos.map(async (photo, index) => {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        zip.file(`findmyshot-${index + 1}.jpg`, blob);
      });

      await Promise.all(downloadPromises);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "findmyshot-photos.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download photos. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  }, [matchedPhotos]);

      if (!userSelfie || !eventCode) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-xl text-ivory">No selfie found</h2>
          <p className="font-sans text-sm tracking-wide text-muted">
            Take a selfie first to find your photos
          </p>
        </div>
        <GoldButton onClick={() => router.push("/scan")}>
          Go to Event Selection
        </GoldButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/90">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-gold">{loadingTexts[currentLoadingText]}</p>
          <p className="mt-1 text-xs text-muted">Scanning {totalScanned || "all"} photos</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="font-sans text-sm tracking-wide text-muted">{error}</p>
          <GhostButton onClick={() => window.location.reload()}>
            Try Again
          </GhostButton>
        </div>
      ) : (
        <>
          {matchedPhotos.length > 0 ? (
            <>
              <div className="mb-2">
                <h1 className="font-display text-2xl text-ivory md:text-3xl">Your Photos</h1>
                <p className="text-[11px] uppercase tracking-widest text-gold">
                  {selectedEventName ?? eventCode}
                </p>
                <p className="mt-1 text-xs text-muted">{matchedPhotos.length} photos found</p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
                {matchedPhotos.map((photo, index) => (
                  <div key={photo.cloudinaryId} className="group relative overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt="Matched result"
                      className="h-full w-full cursor-pointer object-cover"
                      onClick={() => setLightboxIndex(index)}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-[10px] text-muted opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <span>{Math.round(photo.confidence * 100)}% match</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setFavorites((prev) => ({
                              ...prev,
                              [photo.cloudinaryId]: !prev[photo.cloudinaryId],
                            }))
                          }
                          className={`touch-target ${favorites[photo.cloudinaryId] ? "text-gold" : "text-ivory"}`}
                        >
                          ♥
                        </button>
                        <button className="touch-target" onClick={() => handleDownloadSingle(photo)}>
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-6 border-t border-gold/20 bg-surface p-4">
                <GoldButton fullWidth onClick={handleDownloadAll} disabled={downloadingAll}>
                  {downloadingAll
                    ? "Preparing zip..."
                    : `Download All (${matchedPhotos.length} photos)`}
                </GoldButton>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <p className="text-5xl text-gold">📷</p>
              <h2 className="font-display text-xl text-ivory">No photos found for you</h2>
              <p className="text-sm text-muted">Try a clearer selfie with good lighting.</p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <GoldButton onClick={() => router.push("/scan/selfie")}>Try Again</GoldButton>
                <GhostButton onClick={() => router.push("/scan")}>Wrong event?</GhostButton>
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && matchedPhotos.length > 0 && (
        <div className="flex justify-center pb-8 pt-4">
          <GhostButton onClick={() => router.push("/scan/selfie")}>
            Scan Again
          </GhostButton>
        </div>
      )}

      {lightboxIndex !== null && matchedPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 md:p-4">
          <button
            className="absolute right-5 top-5 text-2xl text-ivory"
            onClick={() => setLightboxIndex(null)}
          >
            ×
          </button>
          <button
            className="absolute left-3 touch-target text-2xl text-ivory md:left-4"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === null ? prev : (prev - 1 + matchedPhotos.length) % matchedPhotos.length
              )
            }
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={matchedPhotos[lightboxIndex].url}
            alt="Preview"
            className="max-h-[90vh] max-w-full object-contain"
          />
          <button
            className="absolute right-3 touch-target text-2xl text-ivory md:right-4"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === null ? prev : (prev + 1) % matchedPhotos.length
              )
            }
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <main className="page-transition min-h-screen bg-void px-4 py-8 md:px-6">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
          <GalleryContent />
        </Suspense>
      </div>
    </main>
  );
}
