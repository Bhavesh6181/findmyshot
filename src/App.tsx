import { useState } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Events from './components/Events';
import Selfie from './components/Selfie';
import Gallery from './components/Gallery';
import PhotographerUpload from './components/PhotographerUpload';
import PhotographerEvents from './components/PhotographerEvents';

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
      {view === 'landing' && (
        <Landing onNavigate={handleNavigate} />
      )}
      
      {view === 'login' && (
        <Login onNavigate={handleNavigate} />
      )}
      
      {view === 'events' && (
        <Events 
          onNavigate={handleNavigate} 
          onSelectEvent={handleSelectEvent} 
        />
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
      
      {view === 'photographer-upload' && (
        <PhotographerUpload onNavigate={handleNavigate} />
      )}
      
      {view === 'photographer-events' && (
        <PhotographerEvents onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;
