import React, { useState, useEffect, useRef } from 'react';

interface EventInfo {
  name: string;
  code: string;
  photoCount: number;
}

interface PhotoStatus {
  filename: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  facesFound?: number;
  url?: string;
  errorMsg?: string;
}

interface PhotographerUploadProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

export default function PhotographerUpload({ onNavigate }: PhotographerUploadProps) {
  const userName = localStorage.getItem('user_name') || 'Photographer';
  const userPicture = localStorage.getItem('user_picture') || undefined;

  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState('');
  
  // Create Event Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<PhotoStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await fetch('/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
        if (data.events && data.events.length > 0 && !selectedEventCode) {
          setSelectedEventCode(data.events[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || 'Failed to create event');
      }

      const data = await res.json();
      await loadEvents();
      setSelectedEventCode(data.event.code);
      setEventName('');
      setShowCreateForm(false);
    } catch (err: any) {
      setCreateError(err.message || 'Error creating event.');
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);
    setWarning(null);

    // Strict image-only filter (by MIME type)
    const imageFiles = allFiles.filter(f => f.type.startsWith('image/'));
    const nonImages = allFiles.length - imageFiles.length;

    const limit = 200;
    const acceptedFiles = imageFiles.slice(0, limit);

    const warnings: string[] = [];
    if (nonImages > 0) warnings.push(`${nonImages} non-image file(s) skipped.`);
    if (imageFiles.length > limit) warnings.push(`Max ${limit} images allowed per batch. Dropped ${imageFiles.length - limit} extra files.`);
    if (warnings.length > 0) setWarning(warnings.join(' '));

    setSelectedFiles(acceptedFiles);
    setUploadStatuses(acceptedFiles.map(f => ({
      filename: f.name,
      status: 'pending'
    })));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !selectedEventCode || uploading) return;

    setUploading(true);

    // Start all as pending so user sees the full queue
    const statuses: PhotoStatus[] = selectedFiles.map(f => ({ filename: f.name, status: 'pending' }));
    setUploadStatuses([...statuses]);

    /**
     * Semaphore-based concurrency limiter.
     * Firing all 200 at once causes browser TCP connection starvation (max ~6 per domain).
     * 3 in-flight at a time is the optimal value for a fractional-vCPU backend:
     * fewer workers + server-side CPU queue gives better real throughput than flooding.
     */
    const MAX_CONCURRENT = 3;
    let nextIdx = 0;

    const uploadOne = async (idx: number): Promise<void> => {
      const file = selectedFiles[idx];

      statuses[idx] = { filename: file.name, status: 'uploading' };
      setUploadStatuses([...statuses]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('eventCode', selectedEventCode);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const errData = await res.json();
            msg = errData.message || errData.error || errData.detail || msg;
          } catch {
            try { msg = await res.text() || msg; } catch { /* ignore */ }
          }
          throw new Error(msg);
        }

        const data = await res.json();
        statuses[idx] = {
          filename: file.name,
          status: data.processing ? 'processing' : 'done',
          facesFound: data.facesFound >= 0 ? data.facesFound : undefined,
          url: data.url
        };
      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        statuses[idx] = { filename: file.name, status: 'error', errorMsg: err.message || 'Upload failed' };
      }

      setUploadStatuses([...statuses]);
    };

    // Worker loop: each worker picks the next available file
    const worker = async () => {
      while (true) {
        const idx = nextIdx++;
        if (idx >= selectedFiles.length) break;
        await uploadOne(idx);
      }
    };

    // Start MAX_CONCURRENT workers — they self-schedule until all files are done
    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, selectedFiles.length) }, () => worker())
    );

    setUploading(false);
    loadEvents();
  };

  const clearQueue = () => {
    setSelectedFiles([]);
    setUploadStatuses([]);
    setWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30">
        <nav className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto w-full">
          <div onClick={() => onNavigate('landing')} className="flex items-center gap-unit-xs cursor-pointer">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
          </div>
          <div className="flex items-center gap-3">
            {userPicture ? (
              <img src={userPicture} alt={userName} className="w-7 h-7 rounded-full border border-primary/10" referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
            )}
            <span className="text-xs text-primary font-bold hidden sm:inline">{userName}</span>
            <span className="text-outline-variant/60 hidden sm:inline">|</span>
            <button 
              onClick={() => {
                localStorage.clear();
                onNavigate('landing');
              }}
              className="text-xs text-on-surface-variant hover:text-primary font-bold flex items-center gap-1"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      {/* Navigation tabs */}
      <div className="pt-16 border-b border-outline-variant/30 bg-white">
        <div className="flex justify-center max-w-7xl mx-auto px-margin-desktop">
          <button 
            className="px-6 py-4 border-b-2 border-primary text-primary font-bold text-sm"
          >
            Upload Photos
          </button>
          <button 
            onClick={() => onNavigate('photographer-events')}
            className="px-6 py-4 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
          >
            My Events
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-4xl w-full mx-auto px-margin-mobile py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Left panel: Event Selector & Creation */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <h3 className="font-headline-md text-lg font-bold text-primary mb-4">Select Target Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">Event</label>
                  <select 
                    value={selectedEventCode}
                    onChange={(e) => setSelectedEventCode(e.target.value)}
                    className="w-full h-11 border border-outline-variant/60 rounded-xl px-3 text-sm focus:outline-none focus:border-primary"
                  >
                    {events.map((e) => (
                      <option key={e.code} value={e.code}>{e.name} ({e.code})</option>
                    ))}
                    {events.length === 0 && (
                      <option value="">No events found</option>
                    )}
                  </select>
                </div>

                {!showCreateForm ? (
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Create New Event
                  </button>
                ) : (
                  <form onSubmit={handleCreateEvent} className="pt-4 border-t border-outline-variant/30 space-y-3">
                    <h4 className="text-xs font-bold text-primary">New Event Details</h4>
                    <input 
                      type="text"
                      required
                      placeholder="Event Name (e.g. Summer Ball)"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full h-10 border border-outline-variant rounded-xl px-3 text-xs focus:outline-none focus:border-primary"
                    />
                    {createError && <p className="text-red-500 text-[10px]">{createError}</p>}
                    <div className="flex gap-2">
                      <button 
                        type="submit"
                        disabled={creating}
                        className="flex-1 py-2 bg-brand-gold text-primary font-bold rounded-lg text-xs"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-on-surface font-bold rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: File Drag & Drop, Status Queue */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <h3 className="font-headline-md text-lg font-bold text-primary mb-4">Upload Event Photos</h3>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors group mb-4"
              >
                <span className="material-symbols-outlined text-4xl text-outline mb-2 group-hover:text-primary transition-colors">upload_file</span>
                <p className="text-sm font-bold text-primary mb-1">Click to select photos</p>
                <p className="text-xs text-on-surface-variant">PNG or JPEG format · up to 200 files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs mb-4">
                  {warning}
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                    <span className="text-xs font-bold text-primary">{selectedFiles.length} files selected</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpload}
                        disabled={uploading || !selectedEventCode}
                        className="px-4 py-1.5 bg-brand-gold text-primary font-bold rounded-lg text-xs disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {uploading ? 'Uploading...' : 'Start Upload'}
                      </button>
                      <button 
                        onClick={clearQueue}
                        disabled={uploading}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-on-surface font-bold rounded-lg text-xs"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Upload Status List */}
                  {/* Summary bar */}
                  {uploading || uploadStatuses.some(s => s.status !== 'pending') ? (
                    <div className="flex gap-3 text-[10px] font-bold mb-2">
                      <span className="text-emerald-700">{uploadStatuses.filter(s => s.status === 'done').length} done</span>
                      <span className="text-blue-700">{uploadStatuses.filter(s => s.status === 'processing').length} indexing</span>
                      <span className="text-amber-700">{uploadStatuses.filter(s => s.status === 'uploading').length} uploading</span>
                      {uploadStatuses.some(s => s.status === 'error') && (
                        <span className="text-red-700">{uploadStatuses.filter(s => s.status === 'error').length} failed</span>
                      )}
                    </div>
                  ) : null}

                  <div className="max-h-96 overflow-y-auto space-y-1.5 pr-2">
                    {uploadStatuses.map((status, idx) => (
                      <div key={idx} className="flex justify-between items-center px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/20 text-xs">
                        <span className="font-mono text-on-surface-variant truncate max-w-[180px]">{status.filename}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {status.status === 'done' && (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              ✓ Done
                            </span>
                          )}
                          {status.status === 'uploading' && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px] animate-pulse">
                              ↑ Uploading…
                            </span>
                          )}
                          {status.status === 'processing' && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px] animate-pulse">
                              ✓ Uploaded · indexing faces…
                            </span>
                          )}
                          {status.status === 'error' && (
                            <span
                              className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[10px] max-w-[160px] truncate"
                              title={status.errorMsg || 'Upload failed'}
                            >
                              ✗ {status.errorMsg ? status.errorMsg.slice(0, 40) : 'Failed'}
                            </span>
                          )}
                          {status.status === 'pending' && (
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
