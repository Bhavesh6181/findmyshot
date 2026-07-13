import React, { useState, useEffect } from 'react';

interface EventInfo {
  name: string;
  code: string;
  photoCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface EventPhoto {
  url: string;
  cloudinaryUrl?: string; // Spring Boot compatibility alias
  cloudinaryId: string;
  filename: string;
  facesFound: number;
}

interface PhotographerEventsProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

export default function PhotographerEvents({ onNavigate }: PhotographerEventsProps) {
  const userName = localStorage.getItem('user_name') || 'Photographer';
  const userPicture = localStorage.getItem('user_picture') || undefined;

  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Event Details Modal
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [deletingEventCode, setDeletingEventCode] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await fetch('/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    if (!window.confirm(`Are you sure you want to delete the event ${code}? All uploaded photos will be deleted from Cloudinary.`)) return;

    setDeletingEventCode(code);
    try {
      const res = await fetch(`/events/${code}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadEvents();
        if (selectedEvent?.code === code) {
          setSelectedEvent(null);
        }
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    } finally {
      setDeletingEventCode(null);
    }
  };

  const handleOpenEventDetails = async (event: EventInfo) => {
    setSelectedEvent(event);
    setLoadingPhotos(true);
    setEventPhotos([]);

    try {
      const res = await fetch(`/events/${event.code}`);
      if (res.ok) {
        const data = await res.json();
        // Support both Spring Boot Details DTO shape and direct mappings
        const photosList = data.event?.photos ?? data.photos ?? [];
        setEventPhotos(photosList.map((p: any) => ({
          url: p.url ?? p.cloudinary_url ?? p.cloudinaryUrl,
          cloudinaryId: p.cloudinaryId ?? p.cloudinary_id,
          filename: p.filename ?? 'photo.jpg',
          facesFound: p.facesFound ?? p.faces_found ?? 0
        })));
      }
    } catch (err) {
      console.error('Error loading event photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (cloudinaryId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo? It will be removed from Cloudinary and the event.')) return;

    setDeletingPhotoId(cloudinaryId);
    try {
      const res = await fetch(`/photos/${cloudinaryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Remove from list
        setEventPhotos(prev => prev.filter(p => p.cloudinaryId !== cloudinaryId));
        // Refresh event details list counts
        loadEvents();
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    } finally {
      setDeletingPhotoId(cloudinaryId);
    }
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
            onClick={() => onNavigate('photographer-upload')}
            className="px-6 py-4 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
          >
            Upload Photos
          </button>
          <button 
            className="px-6 py-4 border-b-2 border-primary text-primary font-bold text-sm"
          >
            My Events
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-5xl w-full mx-auto px-margin-mobile py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Events List */}
          <section className="lg:col-span-6 space-y-4">
            <h3 className="font-headline-md text-lg font-bold text-primary border-b border-outline-variant/30 pb-2">My Events</h3>
            
            {loading ? (
              <div className="text-center py-8 text-on-surface-variant">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">event_busy</span>
                <p className="text-sm text-on-surface-variant">No events created yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div 
                    key={e.code}
                    onClick={() => handleOpenEventDetails(e)}
                    className={`flex items-center justify-between p-4 bg-white border ${selectedEvent?.code === e.code ? 'border-primary shadow-sm' : 'border-outline-variant/30'} rounded-xl cursor-pointer hover:shadow-md transition-all`}
                  >
                    <div>
                      <h4 className="font-bold text-primary text-sm leading-tight">{e.name}</h4>
                      <div className="flex gap-4 mt-2 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                        <span className="text-brand-gold font-mono">{e.code}</span>
                        <span>{e.photoCount} photos</span>
                      </div>
                    </div>
                    <button 
                      onClick={(event) => handleDeleteEvent(e.code, event)}
                      disabled={deletingEventCode === e.code}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-md">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Event Details Viewer */}
          <section className="lg:col-span-6 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm min-h-[400px] flex flex-col">
            {selectedEvent ? (
              <div className="flex flex-col h-full flex-grow">
                <div className="border-b border-outline-variant/30 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-md text-lg font-bold text-primary">{selectedEvent.name}</h3>
                    <p className="font-mono text-xs text-brand-gold font-bold mt-1 uppercase tracking-widest">{selectedEvent.code}</p>
                  </div>
                  <button 
                    onClick={() => onNavigate('photographer-upload')}
                    className="bg-primary/5 hover:bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Photos
                  </button>
                </div>

                {loadingPhotos ? (
                  <div className="flex-grow flex items-center justify-center py-12 text-on-surface-variant">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
                    <span>Loading photos list...</span>
                  </div>
                ) : eventPhotos.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-12 text-center text-on-surface-variant border-2 border-dashed border-outline-variant/40 rounded-xl">
                    <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">photo_library</span>
                    <p className="text-xs">No photos in this event yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[450px] pr-1">
                    {eventPhotos.map((photo) => (
                      <div key={photo.cloudinaryId} className="group relative aspect-square rounded-lg overflow-hidden border border-outline-variant/20 bg-slate-50">
                        <img 
                          className="w-full h-full object-cover" 
                          alt={photo.filename} 
                          src={photo.url} 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-[10px] text-white">
                          <div className="text-right">
                            <span className="bg-primary px-1.5 py-0.5 rounded font-bold">
                              {photo.facesFound} face{photo.facesFound !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-auto w-full">
                            <span className="truncate max-w-[80px] font-mono text-[9px] text-white/80">{photo.filename}</span>
                            <button 
                              onClick={() => handleDeletePhoto(photo.cloudinaryId)}
                              disabled={deletingPhotoId === photo.cloudinaryId}
                              className="text-red-400 hover:text-red-600 hover:bg-white/10 p-1 rounded transition-colors disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-on-surface-variant py-12">
                <span className="material-symbols-outlined text-5xl mb-3 text-outline-variant">folder_open</span>
                <p className="text-sm font-bold">No Event Selected</p>
                <p className="text-xs max-w-[200px] mt-1">Select an event from the left list to view uploaded photos and manage assets.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
