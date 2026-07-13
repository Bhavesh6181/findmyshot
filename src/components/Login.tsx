
import { useEffect } from 'react';

interface LoginProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

export default function Login({ onNavigate }: LoginProps) {
  useEffect(() => {
    // Utility to parse/decode Google JWT credentials
    const decodeJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (err) {
        console.error('Error decoding JWT:', err);
        return null;
      }
    };

    const handleCredentialResponse = (response: any) => {
      const payload = decodeJwt(response.credential);
      if (payload) {
        localStorage.setItem('role', 'photographer');
        localStorage.setItem('user_name', payload.name);
        localStorage.setItem('user_picture', payload.picture);
        localStorage.setItem('user_email', payload.email);
        onNavigate('photographer-upload');
      }
    };

    const initGoogleSignIn = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: "224813970161-kbai784qvjkpjvvbkg5as9oq7q0sh305.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        
        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: 320,
            text: "signin_with"
          }
        );
      }
    };

    // Initialize or wait for SDK to load
    const google = (window as any).google;
    if (google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        const googleRetry = (window as any).google;
        if (googleRetry?.accounts?.id) {
          initGoogleSignIn();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [onNavigate]);

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-primary/95 backdrop-blur-md border-b border-secondary/20">
        <div className="flex justify-between items-center px-unit-lg h-16 w-full">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-unit-xs">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
              <span className="font-headline-md text-headline-md font-bold text-secondary">FindMyShot</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:bg-white/10 transition-colors rounded-full p-2">account_circle</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-margin-mobile md:px-margin-desktop relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent"></div>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-unit-lg z-10">
          {/* Attendee Card */}
          <section className="group relative card-hover bg-primary-container rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white">
            <div className="h-48 md:h-56 overflow-hidden relative">
              <img 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                alt="Joyful group of event attendees" 
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600&h=400" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent"></div>
            </div>
            <div className="p-unit-lg flex flex-col flex-grow items-start">
              <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">face</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Instant Access</span>
              </div>
              <h2 className="font-headline-lg text-2xl font-bold text-white mb-2">Attendee</h2>
              <p className="font-body-md text-on-primary-container/80 mb-unit-xl">
                Find your photos from an event by scanning your selfie. No account required. Our facial recognition finds every moment you appear in instantly.
              </p>
              <div className="mt-auto w-full">
                <button 
                  onClick={() => onNavigate('events')}
                  className="gold-glow w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#F59E0B] text-primary font-bold rounded-lg transition-all active:scale-95 duration-150"
                >
                  <span className="material-symbols-outlined">search</span>
                  Find My Photos
                </button>
              </div>
            </div>
          </section>

          {/* Photographer Card */}
          <section className="group relative card-hover bg-primary-container rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white">
            <div className="h-48 md:h-56 overflow-hidden relative">
              <img 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                alt="Photographer with camera" 
                src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?auto=format&fit=crop&q=80&w=600&h=400" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent"></div>
            </div>
            <div className="p-unit-lg flex flex-col flex-grow items-start">
              <div className="bg-primary text-white border border-secondary/20 px-3 py-1 rounded-full mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Professional Portal</span>
              </div>
              <h2 className="font-headline-lg text-2xl font-bold text-white mb-2">Photographer</h2>
              <p className="font-body-md text-on-primary-container/80 mb-unit-xl">
                Manage your events and upload photos to let AI handle delivery. We automate the tagging and distribution so you can focus on the art of the shot.
              </p>
              <div className="mt-auto w-full flex flex-col items-center gap-3">
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[50px]"></div>
                
                {/* Fallback button in case they block third-party cookies or scripts */}
                <button 
                  onClick={() => {
                    localStorage.setItem('role', 'photographer');
                    localStorage.setItem('user_name', 'Bhavesh Bhatkudav (Demo)');
                    localStorage.setItem('user_picture', 'https://lh3.googleusercontent.com/a/ACg8ocL81oA39GqP-v_b6181=s96-c');
                    onNavigate('photographer-upload');
                  }}
                  className="text-center text-white/50 hover:text-white text-[10px] underline transition-colors"
                >
                  Bypass with Mock Google Login
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary dark:bg-primary-container full-width py-unit-lg border-t border-secondary/10">
        <div className="w-full px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-unit-md max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-headline-md text-headline-md font-bold text-secondary">FindMyShot</span>
            <p className="font-body-md text-on-primary/65 text-xs">© 2024 FindMyShot. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-on-primary/65">
            <a className="hover:text-secondary-fixed transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-secondary-fixed transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-secondary-fixed transition-colors" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
