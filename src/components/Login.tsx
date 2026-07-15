import { useEffect, useRef, useState } from 'react';

interface LoginProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

function decodeJwt(token: string): Record<string, any> | null {
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
  } catch {
    return null;
  }
}

export default function Login({ onNavigate }: LoginProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured.');
      return;
    }

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
        // Navigate directly — no DOM cleanup needed because we never called renderButton
        onNavigateRef.current('photographer-upload');
      } else {
        setSigningIn(false);
        setError('Sign-in failed. Please try again.');
      }
    };

    const init = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return false;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleReady(true);
      return true;
    };

    // Try immediately, then poll until SDK loads
    if (!init()) {
      const interval = setInterval(() => { if (init()) clearInterval(interval); }, 200);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setError('Google Sign-In could not load. Check your network and try again.');
      }, 10000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, []);

  const handleGoogleSignIn = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      setError('Google Sign-In is not ready yet. Please wait a moment.');
      return;
    }
    setError(null);
    /**
     * prompt() shows Google's native One Tap / account-chooser UI appended to
     * document.body — it NEVER injects into our React tree, so there is zero
     * removeChild conflict.
     */
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed?.()) {
        // One Tap suppressed (browser blocks third-party cookies, etc.)
        // Fall back to the standard OAuth redirect popup
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: window.location.origin,
          response_type: 'token',
          scope: 'openid email profile',
          prompt: 'select_account',
        });
        const popup = window.open(
          `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
          'google-signin',
          'width=500,height=600,left=200,top=100'
        );
        if (!popup) {
          setError('Popup was blocked. Please allow popups for this site and try again.');
        }
      }
    });
  };

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
        {/* Ambient background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent" />
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-unit-lg z-10">

          {/* ── Attendee Card ── */}
          <section className="group relative card-hover bg-primary-container rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white">
            <div className="h-48 md:h-56 overflow-hidden relative">
              <img
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                alt="Joyful group of event attendees"
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600&h=400"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent" />
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

          {/* ── Photographer Card ── */}
          <section className="group relative card-hover bg-primary-container rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white">
            <div className="h-48 md:h-56 overflow-hidden relative">
              <img
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                alt="Photographer with camera"
                src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?auto=format&fit=crop&q=80&w=600&h=400"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent" />
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

                {/* ── Custom Google Sign-In Button ──
                    We render our OWN button and call google.accounts.id.prompt().
                    GIS draws its UI into document.body — never inside our React tree.
                    This completely eliminates the removeChild DOM conflict. */}
                <button
                  id="photographer-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={!googleReady || signingIn}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow transition-all active:scale-95 duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {/* Google "G" logo */}
                  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  {signingIn
                    ? 'Signing in…'
                    : !googleReady
                    ? 'Loading…'
                    : 'Sign in with Google'}
                </button>

                {error && (
                  <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-2 text-red-300 text-xs w-full">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                    <span>{error}</span>
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
