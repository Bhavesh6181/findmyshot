"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AppState, MatchedPhoto } from "@/types";

const AppContext = createContext<AppState | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [userSelfie, setUserSelfieState] = useState<string | null>(null);
  const [selectedEvent, setSelectedEventCode] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [matchedPhotos, setMatchedPhotosState] = useState<MatchedPhoto[]>([]);

  const setUserSelfie = useCallback((selfie: string) => {
    setUserSelfieState(selfie);
  }, []);

  const setSelectedEvent = useCallback((code: string, name: string) => {
    setSelectedEventCode(code);
    setSelectedEventName(name);
  }, []);

  const setMatchedPhotos = useCallback((photos: MatchedPhoto[]) => {
    setMatchedPhotosState(photos);
  }, []);

  const clearAll = useCallback(() => {
    setUserSelfieState(null);
    setSelectedEventCode(null);
    setSelectedEventName(null);
    setMatchedPhotosState([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userSelfie,
        selectedEvent,
        selectedEventName,
        matchedPhotos,
        setUserSelfie,
        setSelectedEvent,
        setMatchedPhotos,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
