"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import GoldButton from "@/components/ui/GoldButton";
import GhostButton from "@/components/ui/GhostButton";
import UserMenu from "@/components/ui/UserMenu";
import { EventInfo, EventPhoto, PhotoStatus } from "@/types";

// ── Max file limit ──
const MAX_PHOTOS = 50;
const BATCH_SIZE = 5;

// ── Camera icon SVG ──
function CameraIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── Status badge component ──
function StatusBadge({ status, facesFound }: { status: PhotoStatus["status"]; facesFound?: number }) {
  const config = {
    pending: { text: "Pending", className: "bg-faded/20 text-muted" },
    uploading: { text: "Uploading...", className: "bg-gold/20 text-gold animate-pulse" },
    processing: { text: "Processing faces...", className: "bg-gold/20 text-gold animate-pulse" },
    done: {
      text: facesFound === 0 ? "No faces ❌" : `Done ✅ · ${facesFound} face${facesFound !== 1 ? "s" : ""}`,
      className: facesFound === 0 ? "bg-faded/20 text-muted" : "bg-emerald-900/30 text-emerald-400",
    },
    error: { text: "Error", className: "bg-red-900/30 text-red-400" },
  };

  const { text, className } = config[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide transition-all duration-300 ${className}`}
    >
      {text}
    </span>
  );
}

export default function PhotographerPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"upload" | "events" | "analytics">("upload");

  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedEventDetail, setSelectedEventDetail] = useState<{
    name: string;
    code: string;
    photos: EventPhoto[];
    photoCount: number;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventCode, setNewEventCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<PhotoStatus[]>([]);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const manageFileInputRef = useRef<HTMLInputElement>(null);
  const statusListRef = useRef<HTMLDivElement>(null);

  // ── Fetch events on mount ──
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {
      // Silently handle — events will show empty
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Cleanup preview URLs on unmount ──
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // ── Create event handler ──
  const handleCreateEvent = useCallback(async () => {
    if (!newEventName.trim() || !newEventCode.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName.trim(),
          code: newEventCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create event");
        return;
      }

      // Refresh events and select the new one
      await fetchEvents();
      setSelectedEvent(data.event.code);
      setNewEventName("");
      setNewEventCode("");
      setShowCreateForm(false);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, [newEventName, newEventCode, fetchEvents]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setFileWarning(null);
      setUploadComplete(false);
      setUploadStatuses([]);

      const remainingSlots = Math.max(0, MAX_PHOTOS - selectedFiles.length);
      const acceptedFiles = files.slice(0, remainingSlots);
      const droppedCount = files.length - acceptedFiles.length;

      if (droppedCount > 0) {
        setFileWarning(
          `Max ${MAX_PHOTOS} photos total. Skipped ${droppedCount} file${droppedCount > 1 ? "s" : ""}.`
        );
      }

      const newPreviews = acceptedFiles.map((f) => URL.createObjectURL(f));
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
      setUploadComplete(false);

      // Reset file input so the same files can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [selectedFiles.length]
  );

  const handleManageFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedEventDetail) return;
      const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS);
      if (files.length === 0) return;

      setIsUploading(true);
      const statuses: PhotoStatus[] = files.map((f) => ({ filename: f.name, status: "pending" }));
      setUploadStatuses(statuses);
      const updatedStatuses = [...statuses];
      let completedCount = 0;

      const indexed = files.map((file, index) => ({ file, index }));
      const batches: Array<Array<{ file: File; index: number }>> = [];
      for (let i = 0; i < indexed.length; i += BATCH_SIZE) {
        batches.push(indexed.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async ({ file, index }) => {
            updatedStatuses[index] = { ...updatedStatuses[index], status: "processing" };
            setUploadStatuses([...updatedStatuses]);
            try {
              const form = new FormData();
              form.append("file", file);
              const res = await fetch(`/api/events/${selectedEventDetail.code}/add-photos`, {
                method: "PATCH",
                body: form,
              });
              const data = await res.json();
              updatedStatuses[index] = {
                ...updatedStatuses[index],
                status: res.ok ? "done" : "error",
                facesFound: data.facesFound,
                url: data.url,
              };
            } catch {
              updatedStatuses[index] = { ...updatedStatuses[index], status: "error" };
            }
            completedCount += 1;
            setUploadCurrent(completedCount);
            setUploadStatuses([...updatedStatuses]);
          })
        );
      }

      setIsUploading(false);
      await fetchEvents();
      const detailRes = await fetch(`/api/events/${selectedEventDetail.code}`, {
        cache: "no-store",
      });
      const detailData = await detailRes.json();
      if (detailData.event) setSelectedEventDetail(detailData.event);
      if (manageFileInputRef.current) manageFileInputRef.current.value = "";
    },
    [selectedEventDetail, fetchEvents]
  );

  // ── Remove single photo ──
  const handleRemovePhoto = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previewUrls[index]);
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    },
    [previewUrls]
  );

  // ── Upload logic (parallel batches of 5) ──
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || !selectedEvent || isUploading) return;

    setIsUploading(true);
    setUploadComplete(false);
    setUploadCurrent(0);

    // Initialize all statuses as pending
    const initialStatuses: PhotoStatus[] = selectedFiles.map((f) => ({
      filename: f.name,
      status: "pending",
    }));
    setUploadStatuses(initialStatuses);
    const updatedStatuses = [...initialStatuses];
    const updateFileStatus = (
      index: number,
      status: PhotoStatus["status"],
      facesFound?: number,
      url?: string
    ) => {
      updatedStatuses[index] = { ...updatedStatuses[index], status, facesFound, url };
      setUploadStatuses([...updatedStatuses]);
    };

    const indexedFiles = selectedFiles.map((file, index) => ({ file, index }));
    const batches: Array<Array<{ file: File; index: number }>> = [];
    for (let i = 0; i < indexedFiles.length; i += BATCH_SIZE) {
      batches.push(indexedFiles.slice(i, i + BATCH_SIZE));
    }

    let completedCount = 0;

    for (const batch of batches) {
      await Promise.all(
        batch.map(async ({ file, index }) => {
          updateFileStatus(index, "uploading");

          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("eventCode", selectedEvent);

            updateFileStatus(index, "processing");
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();

            if (res.ok && data.success) {
              updateFileStatus(index, "done", data.facesFound, data.url);
            } else {
              updateFileStatus(index, "error");
            }
          } catch {
            updateFileStatus(index, "error");
          }

          completedCount += 1;
          setUploadCurrent(completedCount);
        })
      );

      // Auto-scroll status list to latest after each batch
      if (statusListRef.current) {
        statusListRef.current.scrollTop = statusListRef.current.scrollHeight;
      }
    }

    // Calculate totals
    const totalFaces = updatedStatuses.reduce(
      (sum, s) => sum + (s.facesFound || 0),
      0
    );
    const doneCount = updatedStatuses.filter((s) => s.status === "done").length;

    setIsUploading(false);
    setUploadComplete(true);

    // Show summary — keep statuses visible for review
    setFileWarning(
      `✅ ${doneCount} photos processed, ${totalFaces} faces detected total`
    );

    // Clear files after successful upload
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);

    // Refresh events to update photo counts
    fetchEvents();
  }, [selectedFiles, selectedEvent, isUploading, previewUrls, fetchEvents]);

  const openManageEvent = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/events/${code}`, { cache: "no-store" });
      const data = await res.json();
      if (data.event) {
        setSelectedEventDetail(data.event);
        setActiveTab("events");
      }
    } catch {
      // ignore
    }
  }, []);

  const deleteEvent = useCallback(
    async (code: string) => {
      if (!confirm("Delete this event and all photos?")) return;
      await fetch(`/api/events/${code}`, { method: "DELETE" });
      await fetchEvents();
      if (selectedEventDetail?.code === code) setSelectedEventDetail(null);
    },
    [fetchEvents, selectedEventDetail]
  );

  const deletePhoto = useCallback(
    async (cloudinaryId: string) => {
      if (!confirm("Remove this photo from event?")) return;
      const prev = selectedEventDetail;
      if (!prev) return;
      setSelectedEventDetail({
        ...prev,
        photos: prev.photos.filter((p) => p.cloudinary_id !== cloudinaryId),
        photoCount: prev.photoCount - 1,
      });
      await fetch(`/api/photos/${encodeURIComponent(cloudinaryId)}`, { method: "DELETE" });
      await fetchEvents();
    },
    [selectedEventDetail, fetchEvents]
  );

  // ── Derived values ──
  const selectedEventInfo = events.find((e) => e.code === selectedEvent);
  const totalPhotos = useMemo(
    () => events.reduce((sum, e) => sum + (e.photoCount || 0), 0),
    [events]
  );
  const estimatedBatches = Math.ceil(selectedFiles.length / BATCH_SIZE);
  const estimatedSeconds = estimatedBatches * 4;
  const estimatedDisplay =
    estimatedSeconds < 60
      ? `~${estimatedSeconds} seconds`
      : `~${Math.ceil(estimatedSeconds / 60)} minutes`;
  const progressPercent =
    uploadStatuses.length > 0
      ? Math.round(
          (uploadStatuses.filter((s) => s.status === "done" || s.status === "error").length /
            uploadStatuses.length) *
            100
        )
      : 0;

  return (
    <main className="page-transition min-h-screen bg-void">
      {/* ── SECTION 1: Header ── */}
      <header className="px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl text-ivory md:text-2xl">
              FindMyShot
            </h1>
            <span className="rounded-full border border-gold/30 bg-gold/20 px-3 py-1 font-sans text-[11px] font-medium tracking-widest text-gold">
              Photographer Mode
            </span>
          </div>

          {session?.user && (
            <UserMenu
              name={session.user.name}
              image={session.user.image}
            />
          )}
        </div>
        <div className="mx-auto mt-4 max-w-6xl border-t border-gold/10" />
        <div className="mx-auto mt-4 flex max-w-6xl gap-2">
          {(["upload", "events", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest ${
                activeTab === tab
                  ? "bg-gold/20 text-gold"
                  : "border border-gold/20 text-muted hover:text-ivory"
              }`}
            >
              {tab === "upload" ? "Upload" : tab === "events" ? "My Events" : "Analytics"}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
        {activeTab === "upload" && (
          <>
        <section className="mb-8">
          <label className="mb-3 block font-sans text-[12px] font-medium tracking-widest text-gold">
            SELECT EVENT
          </label>

          <div className="flex gap-3">
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setUploadComplete(false);
                setUploadStatuses([]);
              }}
              className="
                flex-1 appearance-none rounded-lg border border-gold/30
                bg-surface p-3 font-sans text-sm text-ivory
                placeholder:text-muted
                focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30
              "
            >
              <option value="" className="bg-surface text-muted">
                Choose an event...
              </option>
              {events.map((event) => (
                <option
                  key={event.code}
                  value={event.code}
                  className="bg-surface text-ivory"
                >
                  {event.name} ({event.code}) — {event.photoCount} photos
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="
                touch-target flex h-[46px] w-[46px] items-center justify-center
                rounded-lg border border-gold/30 bg-surface
                font-sans text-lg text-gold
                transition-all duration-200
                hover:bg-gold/5
                active:scale-95
              "
              aria-label="Create new event"
            >
              {showCreateForm ? "×" : "+"}
            </button>
          </div>

          {/* Inline create event form */}
          {showCreateForm && (
            <div className="mt-4 animate-fade-in rounded-xl border border-gold/20 bg-surface p-4">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Event Name"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="
                    w-full rounded-lg border border-gold/30
                    bg-void p-3 font-sans text-sm text-ivory
                    placeholder:text-muted
                    focus:border-gold focus:outline-none
                  "
                />
                <input
                  type="text"
                  placeholder="Event Code (e.g. PICT25)"
                  value={newEventCode}
                  onChange={(e) =>
                    setNewEventCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
                    )
                  }
                  maxLength={8}
                  className="
                    w-full rounded-lg border border-gold/30
                    bg-void p-3 font-sans text-sm uppercase text-ivory
                    placeholder:text-muted placeholder:normal-case
                    focus:border-gold focus:outline-none
                  "
                />
                {createError && (
                  <p className="font-sans text-xs text-red-400">{createError}</p>
                )}
                <GoldButton
                  onClick={handleCreateEvent}
                  disabled={
                    isCreating || !newEventName.trim() || !newEventCode.trim()
                  }
                >
                  {isCreating ? "Creating..." : "Create Event"}
                </GoldButton>
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 3: Photo Selection Area ── */}
        {selectedEvent && (
          <section className="animate-fade-in">
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* ── Left Panel: Upload Zone + Photo Grid ── */}
              <div className="flex-1 lg:w-[60%]">
                <label className="mb-3 block font-sans text-[12px] font-medium tracking-widest text-gold">
                  YOUR PHOTOS
                </label>

                {/* Dashed upload zone */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="
                    touch-target w-full
                    rounded-xl border-2 border-dashed border-gold/30
                    bg-[rgba(201,169,110,0.03)]
                    p-8 transition-all duration-200
                    hover:border-gold/50 hover:bg-[rgba(201,169,110,0.06)]
                    active:scale-[0.99]
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                  style={{ minHeight: "200px" }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <CameraIcon />
                    <p className="font-sans text-sm text-ivory/80">
                      Click to select photos
                    </p>
                    <p className="font-sans text-[11px] tracking-wide text-muted">
                      JPG, PNG supported · Select multiple
                    </p>
                  </div>
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />

                {/* File warning */}
                {fileWarning && (
                  <p
                    className={`mt-3 font-sans text-xs tracking-wide ${
                      fileWarning.startsWith("✅")
                        ? "text-emerald-400"
                        : "text-gold"
                    }`}
                  >
                    {fileWarning}
                  </p>
                )}

                {/* Selection actions */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled
                      className="font-sans text-[12px] text-muted/60"
                      title="All shown photos are already selected"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        previewUrls.forEach((url) => URL.revokeObjectURL(url));
                        setSelectedFiles([]);
                        setPreviewUrls([]);
                        setUploadComplete(false);
                        setUploadStatuses([]);
                        setFileWarning(null);
                      }}
                      className="font-sans text-[12px] text-muted transition-colors hover:underline hover:text-ivory"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* Photo preview grid */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrls[index]}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />

                        {/* Remove button */}
                        {!isUploading && (
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="
                              absolute right-1.5 top-1.5
                              flex h-5 w-5 items-center justify-center
                              rounded-full bg-black/50 text-[11px] text-white
                              opacity-0 transition-opacity
                              group-hover:opacity-100
                            "
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                        )}

                        {/* Filename overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/80 to-transparent px-2 pb-1.5 pt-4">
                          <p className="truncate font-sans text-[10px] text-ivory/60">
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right Panel: Upload Summary ── */}
              <div className="lg:w-[40%]">
                <label className="mb-3 block font-sans text-[12px] font-medium tracking-widest text-gold">
                  UPLOAD SUMMARY
                </label>

                {/* Summary card */}
                <div className="rounded-xl border border-gold/20 bg-surface p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="font-display text-3xl text-gold">
                        {selectedFiles.length}
                      </span>
                      <span className="ml-2 font-sans text-sm text-muted">
                        photos selected
                      </span>
                    </div>

                    {selectedEventInfo && (
                      <p className="font-sans text-sm text-ivory/70">
                        Event:{" "}
                        <span className="text-ivory">
                          {selectedEventInfo.name}
                        </span>
                      </p>
                    )}

                    {selectedFiles.length > 0 && (
                      <p className="font-sans text-xs tracking-wide text-muted">
                        Estimated time: {estimatedDisplay}
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload button */}
                <div className="mt-4">
                  <GoldButton
                    fullWidth
                    onClick={handleUpload}
                    disabled={
                      selectedFiles.length === 0 || !selectedEvent || isUploading
                    }
                  >
                    {isUploading
                      ? `Processing ${uploadCurrent} of ${selectedFiles.length}...`
                      : "Upload & Process"}
                  </GoldButton>
                </div>

                {/* Progress section */}
                {(isUploading || uploadComplete) && uploadStatuses.length > 0 && (
                  <div className="mt-4 animate-fade-in">
                    {/* Progress bar */}
                    <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-gold/20">
                      <div
                        className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {isUploading && (
                      <p className="mb-3 font-sans text-xs tracking-wide text-muted">
                        Processing photo {uploadCurrent} of{" "}
                        {uploadStatuses.length}...
                      </p>
                    )}

                    {/* Status list */}
                    <div
                      ref={statusListRef}
                      className="max-h-64 overflow-y-auto rounded-lg border border-gold/10 bg-void/50"
                    >
                      {uploadStatuses.map((ps, i) => (
                        <div
                          key={`${ps.filename}-${i}`}
                          className={`flex items-center justify-between border-b border-gold/5 px-3 py-2 last:border-b-0 ${
                            ps.status === "done" && ps.facesFound === 0
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          <p className="mr-3 max-w-[60%] truncate font-sans text-[11px] text-ivory/70">
                            {ps.filename}
                          </p>
                          <StatusBadge
                            status={ps.status}
                            facesFound={ps.facesFound}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button after upload */}
                {uploadComplete && (
                  <div className="mt-4">
                    <GhostButton
                      fullWidth
                      onClick={() => {
                        setUploadComplete(false);
                        setUploadStatuses([]);
                        setFileWarning(null);
                      }}
                    >
                      Upload More
                    </GhostButton>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Empty state when no event selected */}
        {!selectedEvent && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="font-sans text-sm tracking-wide text-muted">
              Select or create an event to start uploading photos
            </p>
          </div>
        )}
          </>
        )}

        {activeTab === "events" && !selectedEventDetail && (
          <section>
            {events.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/20 bg-surface p-10 text-center">
                <p className="text-5xl text-gold">📷</p>
                <p className="font-display text-xl text-ivory">No events yet</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="text-sm text-muted hover:text-ivory"
                >
                  Create your first event
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {events.map((event) => (
                  <div key={event.code} className="rounded-xl border border-gold/20 bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg text-ivory">{event.name}</h3>
                        <div className="mt-1 inline-flex rounded-full bg-gold/10 px-2 py-0.5 text-xs uppercase tracking-widest text-gold">
                          {event.code}
                        </div>
                        <p className="mt-2 text-sm text-muted">{event.photoCount} photos</p>
                        <p className="text-[11px] text-faded">
                          Last updated:{" "}
                          {event.updatedAt
                            ? new Date(event.updatedAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <GhostButton onClick={() => openManageEvent(event.code)}>
                          Manage Photos
                        </GhostButton>
                        <button
                          onClick={() => deleteEvent(event.code)}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400"
                        >
                          Delete Event
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "events" && selectedEventDetail && (
          <section>
            <button
              onClick={() => setSelectedEventDetail(null)}
              className="mb-3 text-sm text-muted hover:text-ivory"
            >
              ← All Events
            </button>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-ivory">{selectedEventDetail.name}</h2>
                <p className="text-xs uppercase tracking-widest text-gold">{selectedEventDetail.code}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold">
                  {selectedEventDetail.photoCount} photos
                </span>
                <GoldButton onClick={() => manageFileInputRef.current?.click()}>
                  Add More Photos
                </GoldButton>
              </div>
            </div>
            <input
              ref={manageFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleManageFileSelect}
            />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {selectedEventDetail.photos.map((photo) => (
                <div key={photo.cloudinary_id} className="group relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.cloudinary_url} alt={photo.filename || "Event photo"} className="aspect-square w-full object-cover" />
                  <div
                    className={`absolute inset-0 flex flex-col justify-between p-2 ${
                      photo.facesFound === 0 ? "bg-black/40" : "bg-black/20 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-gold/80 px-2 py-0.5 text-[10px] text-black">
                        {photo.facesFound === 0 ? "No faces" : `${photo.facesFound} faces`}
                      </span>
                      <button
                        onClick={() => deletePhoto(photo.cloudinary_id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(isUploading || uploadStatuses.length > 0) && (
              <div className="mt-4 rounded-lg border border-gold/20 bg-surface p-3">
                <p className="mb-2 text-xs text-muted">
                  Upload progress: {uploadCurrent}/{uploadStatuses.length}
                </p>
                <div className="grid gap-1">
                  {uploadStatuses.map((s, i) => (
                    <p key={`${s.filename}-${i}`} className="text-xs text-muted">
                      {s.filename} — {s.status}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-gold/20 bg-surface p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Total Events</p>
              <p className="mt-2 font-display text-3xl text-ivory">{events.length}</p>
            </div>
            <div className="rounded-xl border border-gold/20 bg-surface p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Total Photos</p>
              <p className="mt-2 font-display text-3xl text-ivory">{totalPhotos}</p>
            </div>
            <div className="rounded-xl border border-gold/20 bg-surface p-4">
              <p className="text-xs uppercase tracking-widest text-muted">Avg Photos / Event</p>
              <p className="mt-2 font-display text-3xl text-ivory">
                {events.length ? Math.round(totalPhotos / events.length) : 0}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
