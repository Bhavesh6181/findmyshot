
import { useEffect, useState } from 'react';

interface LoginProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export default function Login({ onNavigate }: LoginProps) {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSigningIn(true);
      setError(null);
      const payload = decodeJwt(response.credential);
      if (payload) {
        localStorage.setItem('role', 'photographer');
        localStorage.setItem('user_name', payload.name || '');
        localStorage.setItem('user_picture', payload.picture || '');
        localStorage.setItem('user_email', payload.email || '');
        localStorage.setItem('google_token', response.credential);
        setSigningIn(false);
        onNavigate('photographer-upload');
      } else {
        setSigningIn(false);
        setError('Sign-in failed. Please try again.');
      }
    };

    const initGoogleSignIn = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      if (!GOOGLE_CLIENT_ID) {
        console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables.');
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const btnEl = document.getElementById('google-signin-btn');
      if (btnEl) {
        google.accounts.id.renderButton(btnEl, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'rectangular',
          width: 300,
          text: 'signin_with',
          logo_alignment: 'center',
        });
      }

      setGoogleLoaded(true);
    };

    // Initialize or wait for GIS SDK to load
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
      // Timeout fallback if script never loads
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setError('Google Sign-In could not load. Check your network and try refreshing.');
      }, 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
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
                {/* Google Sign-In Button rendered by GIS SDK */}
                <div
                  id="google-signin-btn"
                  className="w-full flex justify-center min-h-[50px] items-center"
                >
                  {!googleLoaded && (
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      Loading Google Sign-In…
                    </div>
                  )}
                </div>

                {signingIn && (
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    Signing you in…
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-2 text-red-300 text-xs w-full">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}
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
