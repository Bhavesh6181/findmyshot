import { useState, Component } from 'react';
import type { ReactNode } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Events from './components/Events';
import Selfie from './components/Selfie';
import Gallery from './components/Gallery';
import PhotographerUpload from './components/PhotographerUpload';
import PhotographerEvents from './components/PhotographerEvents';

// ── Error Boundary ──────────────────────────────────────────────────────────
// Catches any render-time JS errors and shows a readable message instead of
// a blank white screen. This is critical for diagnosing production crashes.
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#f1f5f9', fontFamily: 'monospace',
          padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '500px', marginBottom: '1rem' }}>
            {err.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App ──────────────────────────────────────────────────────────────────────
type ViewType =
  | 'landing'
  | 'login'
  | 'events'
  | 'selfie'
  | 'gallery'
  | 'photographer-upload'
  | 'photographer-events';

function App() {
  const [view, setView] = useState<ViewType>('landing');
  const [selectedEventCode, setSelectedEventCode] = useState<string>('');
  const [selectedEventName, setSelectedEventName] = useState<string>('');
  const [selfieBase64, setSelfieBase64] = useState<string>('');

  const handleSelectEvent = (code: string, name: string) => {
    setSelectedEventCode(code);
    setSelectedEventName(name);
  };

  const handleSetSelfie = (base64Data: string) => {
    setSelfieBase64(base64Data);
  };

  const handleNavigate = (newView: ViewType) => {
    // Basic route intercept for Photographer session check
    if (newView === 'photographer-upload' || newView === 'photographer-events') {
      const role = localStorage.getItem('role');
      if (role !== 'photographer') {
        setView('login');
        return;
      }
    }
    setView(newView);
  };

  return (
    <div className="w-full min-h-screen bg-background">
      {view === 'landing' && <Landing onNavigate={handleNavigate} />}
      {view === 'login' && <Login onNavigate={handleNavigate} />}
      {view === 'events' && (
        <Events onNavigate={handleNavigate} onSelectEvent={handleSelectEvent} />
      )}
      {view === 'selfie' && (
        <Selfie
          onNavigate={handleNavigate}
          selectedEventCode={selectedEventCode}
          selectedEventName={selectedEventName}
          onSetSelfie={handleSetSelfie}
        />
      )}
      {view === 'gallery' && (
        <Gallery
          onNavigate={handleNavigate}
          eventCode={selectedEventCode}
          eventName={selectedEventName}
          selfieBase64={selfieBase64}
        />
      )}
      {view === 'photographer-upload' && <PhotographerUpload onNavigate={handleNavigate} />}
      {view === 'photographer-events' && <PhotographerEvents onNavigate={handleNavigate} />}
    </div>
  );
}

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
