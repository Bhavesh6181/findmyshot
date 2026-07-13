import { useState, useEffect } from 'react';

interface EventInfo {
  name: string;
  code: string;
  photoCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface EventsProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
  onSelectEvent: (code: string, name: string) => void;
}

export default function Events({ onNavigate, onSelectEvent }: EventsProps) {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/events');
        if (!res.ok) {
          throw new Error('Failed to load events');
        }
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (err) {
        console.error('Error fetching events:', err);
        // Fallback mock events for smooth demo if backend isn't running or empty
        setEvents([
          { name: "Metropolitan Charity Gala", code: "GALA2026", photoCount: 48 },
          { name: "Global Tech Innovation Summit", code: "TECH2026", photoCount: 12 },
          { name: "Ethereal Autumn Wedding", code: "WED2026", photoCount: 89 }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleSelect = (event: EventInfo) => {
    onSelectEvent(event.code, event.name);
    onNavigate('selfie');
  };

  const handleVerifyCode = async () => {
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode.length === 0) return;

    try {
      setError(null);
      const res = await fetch(`/events/${cleanCode}`);
      if (!res.ok) {
        throw new Error('Event not found');
      }
      const data = await res.json();
      const eventDetails = data.event;
      onSelectEvent(eventDetails.code, eventDetails.name);
      onNavigate('selfie');
    } catch (err) {
      // Check if it's in our mock list
      const matched = events.find(e => e.code.toUpperCase() === cleanCode);
      if (matched) {
        onSelectEvent(matched.code, matched.name);
        onNavigate('selfie');
      } else {
        setError('Invalid event code. Please check and try again.');
      }
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30">
        <nav className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div onClick={() => onNavigate('landing')} className="flex items-center gap-unit-xs cursor-pointer">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
          </div>
          <div className="flex items-center">
            <button onClick={() => onNavigate('landing')} className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">home</span>
              Home
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center mb-unit-lg">
          <span className="text-brand-gold font-label-sm text-label-sm uppercase tracking-[0.2em] mb-2 block font-bold">Discover Your Memories</span>
          <h2 className="font-headline-lg text-3xl font-extrabold text-primary mb-unit-sm">Select Your Event</h2>
          <p className="font-body-md text-on-surface-variant max-w-md mx-auto">Choose an event from the list below, or enter your unique code directly to find your matches.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Active Events Grid */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <h3 className="font-headline-md text-xl font-bold text-primary border-b border-outline-variant/30 pb-2">Active Events</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                <p>Loading active events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-outline-variant/30 text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">event_busy</span>
                <p className="font-body-md text-on-surface-variant">No active events found. Please enter code manually.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {events.map((event) => (
                  <button 
                    key={event.code}
                    onClick={() => handleSelect(event)}
                    className="event-card-hover group text-left p-6 bg-white border border-outline-variant/30 rounded-xl transition-all duration-300 flex flex-col justify-between h-48 shadow-sm"
                  >
                    <div>
                      <span className="text-secondary font-bold text-xs uppercase tracking-tighter mb-2 block">
                        {event.code.includes('GALA') ? 'Gala' : event.code.includes('TECH') ? 'Summit' : event.code.includes('WED') ? 'Wedding' : 'Event'}
                      </span>
                      <h4 className="text-primary font-headline-md text-lg font-bold leading-tight line-clamp-2">{event.name}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-auto w-full">
                      <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                        <span className="material-symbols-outlined text-primary text-sm">qr_code_2</span>
                        <span className="text-primary font-mono font-bold tracking-widest text-xs">{event.code}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-bold">{event.photoCount} photos</span>
                      <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Event Code Section */}
          <section className="lg:col-span-4 bg-primary-container p-6 rounded-2xl shadow-xl border border-white/10 text-white">
            <div className="mb-6">
              <h3 className="font-headline-md text-xl font-bold mb-2">Have a Code?</h3>
              <p className="text-on-primary-container/80 text-sm">Enter your 8-character event code provided by the organizer.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-xs mb-1 ml-1" htmlFor="event-code">Event Code</label>
                <input 
                  className={`w-full h-12 bg-white/5 border ${error ? 'border-red-500' : 'border-white/20'} rounded-xl px-4 text-brand-gold font-mono text-lg tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold placeholder:text-white/20 placeholder:tracking-normal transition-all`}
                  id="event-code"
                  maxLength={8}
                  placeholder="E.g. GALA2026"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                />
                
                {error && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </p>
                )}
              </div>
              
              <button 
                onClick={handleVerifyCode}
                className="w-full h-12 bg-brand-gold hover:bg-brand-gold/90 text-primary font-bold text-md rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                Continue
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="bg-brand-gold/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-brand-gold">help_outline</span>
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold">Need assistance?</h4>
                  <p className="text-white/40 text-[10px] mt-1">Codes are usually found on event signage or invitation emails.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-low border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center py-6 px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">camera_enhance</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
          </div>
          <p className="text-xs text-on-surface-variant">© 2024 FindMyShot. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-on-surface-variant">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}
