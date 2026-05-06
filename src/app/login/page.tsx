import { signIn } from "@auth";

function ApertureIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      className="text-gold"
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 4 L28 16 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M41.3 14 L30 18 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M41.3 34 L30 28 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 44 L20 32 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M6.7 34 L18 30 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M6.7 14 L18 18 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <polygon points="24,16 30.9,20 30.9,28 24,32 17.1,28 17.1,20" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function CameraCardIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UserCardIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GoldDot() {
  return <span className="mr-2 inline-block h-1 w-1 rounded-full bg-gold/60" />;
}

export default function LoginPage() {
  return (
    <main className="page-transition flex min-h-screen flex-col items-center justify-center bg-void px-4 py-12">
      {/* Page header */}
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <ApertureIcon />
        <h1 className="font-display text-[28px] text-ivory">FindMyShot</h1>
        <p className="font-sans text-sm tracking-wide text-muted">
          Every moment, found.
        </p>
      </div>

      {/* Two-card layout */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── LEFT CARD: Photographer ── */}
        <div className="flex flex-col rounded-2xl border border-gold/20 bg-surface p-8">
          <div className="mb-4">
            <CameraCardIcon />
          </div>

          <h2 className="font-display text-[22px] text-ivory">
            I&apos;m a Photographer
          </h2>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
            Upload and manage event photos. Control which events are live.
          </p>

          <div className="my-5 h-px bg-gold/10" />

          <ul className="mb-6 flex flex-col gap-2.5">
            {["Upload bulk photos", "AI face processing", "Event management", "Access control"].map(
              (feature) => (
                <li key={feature} className="flex items-center font-sans text-[12px] tracking-wide text-muted">
                  <GoldDot />
                  {feature}
                </li>
              )
            )}
          </ul>

          <div className="mt-auto">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/photographer" });
              }}
            >
              <button
                type="submit"
                className="
                  touch-target flex w-full items-center justify-center gap-3
                  rounded-full bg-white px-6 py-3
                  font-sans text-[14px] font-medium text-gray-800
                  transition-colors duration-200
                  hover:bg-gray-100
                  active:scale-[0.98]
                "
              >
                <GoogleLogo />
                Continue with Google
              </button>
            </form>

            <p className="mt-3 text-center font-sans text-[10px] tracking-wide text-muted">
              Access restricted to approved photographers
            </p>
          </div>
        </div>

        {/* ── RIGHT CARD: Event Attendee ── */}
        <div className="flex flex-col rounded-2xl border border-gold/10 bg-surface p-8">
          <div className="mb-4">
            <UserCardIcon />
          </div>

          <h2 className="font-display text-[22px] text-ivory">
            I&apos;m Looking for Photos
          </h2>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
            Find all photos of you from any event instantly.
          </p>

          <div className="my-5 h-px bg-gold/10" />

          <ul className="mb-6 flex flex-col gap-2.5">
            {["Upload one selfie", "AI finds your photos", "Download instantly", "Private & secure"].map(
              (feature) => (
                <li key={feature} className="flex items-center font-sans text-[12px] tracking-wide text-muted">
                  <GoldDot />
                  {feature}
                </li>
              )
            )}
          </ul>

          <div className="mt-auto">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/scan" });
              }}
            >
              <button
                type="submit"
                className="
                  touch-target flex w-full items-center justify-center gap-3
                  rounded-full bg-white px-6 py-3
                  font-sans text-[14px] font-medium text-gray-800
                  transition-colors duration-200
                  hover:bg-gray-100
                  active:scale-[0.98]
                "
              >
                <GoogleLogo />
                Continue with Google
              </button>
            </form>

            <p className="mt-3 text-center font-sans text-[10px] tracking-wide text-muted">
              Your selfie is never stored permanently
            </p>
          </div>
        </div>
      </div>

      {/* Terms footer */}
      <p className="mt-8 font-sans text-[11px] text-faded">
        By continuing, you agree to our Terms &amp; Privacy Policy
      </p>
    </main>
  );
}
