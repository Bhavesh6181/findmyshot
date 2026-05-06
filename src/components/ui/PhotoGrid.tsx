"use client";

import Image from "next/image";
import { MatchedPhoto } from "@/types";

interface PhotoGridProps {
  photos: MatchedPhoto[];
  onDownload?: (photo: MatchedPhoto) => void;
  onFavorite?: (photo: MatchedPhoto) => void;
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function PhotoGrid({
  photos,
  onDownload,
  onFavorite,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="font-sans text-sm tracking-wide text-muted">
          No photos found yet
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 gap-1.5 md:columns-3 lg:columns-4">
      {photos.map((photo, index) => (
        <div
          key={photo.cloudinaryId}
          className="photo-item group relative mb-1.5 break-inside-avoid overflow-hidden rounded-lg"
        >
          <Image
            src={photo.url}
            alt={`Matched photo ${index + 1}`}
            width={400}
            height={500}
            className="block w-full object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Hover overlay with gradient + action icons */}
          <div className="photo-overlay absolute inset-0 flex items-end justify-between bg-gradient-to-t from-void/70 via-transparent to-transparent p-3">
            <button
              onClick={() => onFavorite?.(photo)}
              className="touch-target flex items-center justify-center text-ivory/70 transition-colors hover:text-gold"
              aria-label="Add to favorites"
            >
              <HeartIcon />
            </button>
            <button
              onClick={() => onDownload?.(photo)}
              className="touch-target flex items-center justify-center text-ivory/70 transition-colors hover:text-gold"
              aria-label="Download photo"
            >
              <DownloadIcon />
            </button>
          </div>

          {/* Confidence badge */}
          {photo.confidence > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-void/60 px-2 py-0.5 text-[10px] tracking-wide text-gold backdrop-blur-sm">
              {Math.round(photo.confidence * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
