
interface LandingProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30">
        <nav className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div className="flex items-center gap-unit-xs">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
          </div>
          <div className="flex items-center gap-unit-md">
            <a href="#how-it-works" className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors">How it works</a>
            <button 
              onClick={() => onNavigate('events')}
              className="bg-primary text-on-primary px-unit-md py-unit-xs rounded-full text-label-md font-label-md hover:opacity-90 transition-all"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-16 flex-grow">
        {/* Hero Section */}
        <section className="relative px-margin-mobile pt-unit-lg pb-unit-xl flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="w-full max-w-md mb-unit-lg overflow-hidden rounded-xl shadow-lg border border-outline-variant">
            <div className="relative h-64 w-full">
              <img 
                className="w-full h-full object-cover" 
                alt="Joyful wedding reception" 
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600&h=400" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          </div>
          <h1 className="font-display-lg text-4xl md:text-5xl font-extrabold mb-unit-md text-primary leading-tight">
            Find your photos from any event by scanning your selfie.
          </h1>
          <p className="font-body-lg text-lg text-on-surface-variant mb-unit-lg max-w-md">
            No more scrolling through thousands of photos. Our AI finds your moments instantly.
          </p>
          
          {/* CTA Entry Points */}
          <div className="flex flex-col gap-unit-md w-full max-w-xs">
            <button 
              onClick={() => onNavigate('events')}
              className="bg-secondary-container text-on-secondary-container font-bold py-3 rounded-xl shadow-sm hover:brightness-105 active:scale-95 transition-all text-lg"
            >
              I'm an Attendee
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="bg-white border-2 border-secondary-container text-on-secondary-container font-bold py-3 rounded-xl hover:bg-secondary-fixed/20 active:scale-95 transition-all text-lg"
            >
              I'm a Photographer
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-surface-container-low py-unit-xl px-margin-mobile">
          <div className="max-w-7xl mx-auto">
            <div className="mb-unit-lg text-center">
              <h2 className="font-headline-lg text-3xl font-bold text-primary mb-2">How it works</h2>
              <p className="font-body-md text-on-surface-variant">Three simple steps to your memories</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Step 1 */}
              <div className="bg-white p-unit-md rounded-xl border border-outline-variant/30 flex flex-col items-start gap-unit-sm shadow-sm relative overflow-hidden group">
                <div className="bg-primary-container/5 p-unit-sm rounded-lg text-primary">
                  <span className="material-symbols-outlined">event_note</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold mb-unit-xs text-primary">1. Enter event code</h3>
                  <p className="font-body-md text-on-surface-variant">Simply type in the unique code shared by your event organizer or photographer.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="bg-white p-unit-md rounded-xl border border-outline-variant/30 flex flex-col items-start gap-unit-sm shadow-sm relative overflow-hidden group">
                <div className="bg-primary-container/5 p-unit-sm rounded-lg text-primary">
                  <span className="material-symbols-outlined">face</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold mb-unit-xs text-primary">2. Scan your selfie</h3>
                  <p className="font-body-md text-on-surface-variant">Our secure AI analyzes your features to find matches across all event galleries.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="bg-white p-unit-md rounded-xl border border-outline-variant/30 flex flex-col items-start gap-unit-sm shadow-sm relative overflow-hidden group">
                <div className="bg-primary-container/5 p-unit-sm rounded-lg text-primary">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold mb-unit-xs text-primary">3. Get matched photos</h3>
                  <p className="font-body-md text-on-surface-variant">Instant access to every photo you're in. Download, share, and relive the moment.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-unit-xl px-margin-mobile text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-unit-xl max-w-4xl mx-auto text-primary font-bold text-sm tracking-widest uppercase">
            <div>AI-Powered Matching</div>
            <div className="hidden md:block text-outline">•</div>
            <div>Instant Results</div>
            <div className="hidden md:block text-outline">•</div>
            <div>No Account Needed</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-inverse-surface w-full py-unit-xl border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-unit-md max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-unit-xs">
            <div className="flex items-center gap-unit-xs">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
              <span className="font-headline-md text-headline-md font-bold text-primary">FindMyShot</span>
            </div>
            <p className="text-on-surface-variant text-label-sm">© 2024 FindMyShot AI. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-unit-lg text-left">
            <div className="flex flex-col gap-unit-xs">
              <span className="font-label-md text-on-surface font-bold">For Attendees</span>
              <button onClick={() => onNavigate('events')} className="text-on-surface-variant text-label-sm hover:text-primary text-left transition-colors">Find My Photos</button>
              <a className="text-on-surface-variant text-label-sm hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
            </div>
            <div className="flex flex-col gap-unit-xs">
              <span className="font-label-md text-on-surface font-bold">For Photographers</span>
              <button onClick={() => onNavigate('login')} className="text-on-surface-variant text-label-sm hover:text-primary text-left transition-colors">Create Event</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
