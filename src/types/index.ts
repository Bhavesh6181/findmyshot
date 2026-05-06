import "next-auth";

// ── Extend NextAuth session with custom role ──
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: "photographer" | "user";
    };
  }
}

export interface MatchedPhoto {
  url: string;
  cloudinaryId: string;
  confidence: number;
}

export interface EventData {
  code: string;
  name: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  photoCount: number;
}

export interface MatchResponse {
  photos: MatchedPhoto[];
}

export interface MatchRequest {
  selfieBase64: string;
  eventCode: string;
}

export interface AppState {
  userSelfie: string | null;
  selectedEvent: string | null;
  selectedEventName: string | null;
  matchedPhotos: MatchedPhoto[];
  setUserSelfie: (selfie: string) => void;
  setSelectedEvent: (code: string, name: string) => void;
  setMatchedPhotos: (photos: MatchedPhoto[]) => void;
  clearAll: () => void;
}

// ── Photographer Dashboard Types ──

export interface EventInfo {
  name: string;
  code: string;
  photoCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventPhoto {
  cloudinary_url: string;
  cloudinary_id: string;
  filename: string;
  facesFound: number;
  uploadedAt?: string | null;
}

export type PhotoUploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface PhotoStatus {
  filename: string;
  status: PhotoUploadStatus;
  facesFound?: number;
  url?: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  statuses: PhotoStatus[];
}
