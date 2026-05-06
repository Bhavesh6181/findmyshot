"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GhostButton from "@/components/ui/GhostButton";
import UserMenu from "@/components/ui/UserMenu";
import { useAppContext } from "@/context/AppContext";
import { EventInfo } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setSelectedEvent, clearAll } = useAppContext();
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [manualCode, setManualCode] = useState("");
  const CODE_LENGTH = 8;
  const codeInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearAll();
  }, [clearAll]);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await fetch("/api/events/public");
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch {
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const eventByCode = useMemo(
    () => new Map(events.map((e) => [e.code.toUpperCase(), e])),
    [events]
  );

  const selectEvent = (code: string, name: string) => {
    setSelectedEvent(code, name);
    router.push("/scan/selfie");
  };

  const handleManualFind = () => {
    const normalized = manualCode.toUpperCase().trim();
    const event = eventByCode.get(normalized);
    if (!event) {
      setError("Event code not found.");
      return;
    }
    selectEvent(event.code, event.name);
  };

  const handleCodeChange = (index: number, value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) {
      const next = manualCode.split("");
      next[index] = "";
      setManualCode(next.join(""));
      return;
    }

    const next = manualCode.padEnd(CODE_LENGTH, " ").split("");
    next[index] = clean[clean.length - 1];
    const normalized = next.join("").replace(/\s/g, "").slice(0, CODE_LENGTH);
    setManualCode(normalized);

    if (index < CODE_LENGTH - 1) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !manualCode[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <main className="page-transition min-h-screen bg-void px-4 py-6 md:px-6 md:py-8">
      {/* User bar */}
      {session?.user && (
        <div className="mx-auto mb-5 flex w-full max-w-5xl items-center justify-between">
          <h1 className="font-display text-lg text-ivory md:text-xl">FindMyShot</h1>
          <UserMenu
            name={session.user.name}
            image={session.user.image}
            showGreeting
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:gap-6">
        <div className="text-center">
          <h2 className="font-display text-2xl text-ivory md:text-3xl">
            Which event are you looking for?
          </h2>
          <p className="mt-2 font-sans text-sm text-muted">
            Select the event you attended
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-gold/20 bg-surface p-10 text-center">
            <p className="text-4xl text-gold">📷</p>
            <p className="font-display text-xl text-ivory">No events yet</p>
            <p className="text-sm text-muted">Ask your photographer to create one first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
            {events.map((event) => (
              <button
                key={event.code}
                onClick={() => selectEvent(event.code, event.name)}
                className="touch-target rounded-2xl border border-gold/10 bg-surface p-4 text-left transition-all hover:border-gold/40 hover:bg-gold/5"
              >
                <div className="font-display text-[15px] leading-snug text-ivory">{event.name}</div>
                <div className="mt-1 text-xs text-muted">
                  {event.updatedAt
                    ? new Date(event.updatedAt).toLocaleDateString()
                    : "Date unavailable"}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-gold">
                  <span>{event.photoCount} photos</span>
                  <span className="text-muted">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-gold/20 bg-surface p-4">
          <p className="mb-3 text-sm text-muted">Have an event code?</p>
          <div className="mb-3 grid grid-cols-4 gap-2 md:grid-cols-8">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => {
                  codeInputsRef.current[i] = el;
                }}
                value={manualCode[i] ?? ""}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e.key)}
                maxLength={1}
                className="h-11 rounded-lg border border-gold/20 bg-void text-center text-sm uppercase text-ivory focus:border-gold focus:outline-none"
              />
            ))}
          </div>
          <div className="flex justify-end">
            <GhostButton onClick={handleManualFind}>Find Event</GhostButton>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </main>
  );
}
