import React, { useState, useRef } from 'react';

interface LoginProps {
  onNavigate: (view: 'landing' | 'login' | 'events' | 'selfie' | 'gallery' | 'photographer-upload' | 'photographer-events') => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSigningIn(true);
    setError(null);
    setTimeout(() => {
      localStorage.setItem('role', 'photographer');
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_picture', `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`);
      localStorage.setItem('user_email', email);
      localStorage.setItem('google_token', 'mock_email_token');
      setSigningIn(false);
      onNavigateRef.current('photographer-upload');
    }, 800);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSigningIn(true);
    setError(null);
    setTimeout(() => {
      localStorage.setItem('role', 'photographer');
      const displayName = email.split('@')[0] || 'Photographer';
      localStorage.setItem('user_name', displayName.charAt(0).toUpperCase() + displayName.slice(1));
      localStorage.setItem('user_picture', `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`);
      localStorage.setItem('user_email', email);
      localStorage.setItem('google_token', 'mock_email_token');
      setSigningIn(false);
      onNavigateRef.current('photographer-upload');
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0F1D] text-white">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0F1D]/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F59E0B] group-hover:rotate-12 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
              <span className="font-headline-md text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">FindMyShot</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-white/70 cursor-pointer hover:bg-white/10 hover:text-white transition-all rounded-full p-2">account_circle</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Glow Effects in Background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Auth Card */}
        <div className="max-w-md w-full bg-[#111827]/75 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 flex flex-col relative">
          {/* Top Decorative bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-amber-400 to-purple-600 rounded-t-3xl" />

          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-500/30 p-3.5 rounded-2xl text-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              {isSignUp ? 'Join as a Photographer' : 'Photographer Portal'}
            </h2>
            <p className="text-sm text-gray-400 text-center px-4 leading-relaxed">
              {isSignUp 
                ? 'Create an account to upload shots and let AI deliver them to guests.' 
                : 'Welcome back! Sign in to manage your premium galleries.'}
            </p>
          </div>

          {isSignUp ? (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">person</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="photographer@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Confirm Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">lock</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0A0F1D] font-extrabold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_24px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                {signingIn && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Create Free Account
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-semibold cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="photographer@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-focus-within:text-[#F59E0B] transition-colors">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 bg-[#1F2937]/55 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0A0F1D] font-extrabold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_24px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                {signingIn && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Sign In to Dashboard
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-semibold cursor-pointer"
                >
                  Don't have an account? Sign Up
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5 text-red-400 text-xs w-full mt-5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0F1D] w-full py-6 border-t border-white/5">
        <div className="w-full px-6 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-xs text-gray-500">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-extrabold text-gray-400">FindMyShot</span>
            <p>© 2024 FindMyShot. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="hover:text-gray-300 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-gray-300 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-gray-300 transition-colors" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
