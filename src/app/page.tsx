import Link from "next/link";
import GoldButton from "@/components/ui/GoldButton";
import { auth } from "@auth";

function ApertureIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className="text-gold"
    >
      {/* 6-blade aperture with stroke only */}
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 4 L28 16 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M41.3 14 L30 18 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M41.3 34 L30 28 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 44 L20 32 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M6.7 34 L18 30 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M6.7 14 L18 18 L24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Inner aperture opening */}
      <polygon
        points="24,16 30.9,20 30.9,28 24,32 17.1,28 17.1,20"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="page-transition flex min-h-screen flex-col items-center justify-center bg-void px-6">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        {/* Aperture icon */}
        <ApertureIcon />

        {/* Brand name */}
        <h2 className="font-display text-2xl tracking-wide text-ivory">
          FindMyShot
        </h2>

        {/* Divider */}
        <div className="h-px w-16 bg-gold/20" />

        {/* Hero text */}
        <h1 className="font-display text-4xl leading-tight text-ivory md:text-5xl">
          You were there.
        </h1>

        {/* Subtext */}
        <p className="font-sans text-sm tracking-wide text-muted md:text-base">
          Find every photo of you from any event.
        </p>

        {/* Spacer */}
        <div className="h-4" />

        {/* Auth-aware CTA */}
        {session?.user?.role === "photographer" ? (
          <Link href="/photographer" className="w-full">
            <GoldButton fullWidth>Go to Dashboard</GoldButton>
          </Link>
        ) : session?.user?.role === "user" ? (
          <Link href="/scan" className="w-full">
            <GoldButton fullWidth>Find My Photos</GoldButton>
          </Link>
        ) : (
          <Link href="/login" className="w-full">
            <GoldButton fullWidth>Get Started</GoldButton>
          </Link>
        )}

        {/* Film strip decorative element */}
        <div className="mt-8 flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-6 rounded-sm bg-gold/10"
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-4 font-sans text-[11px] tracking-widest text-faded">
          POWERED BY FACE RECOGNITION
        </p>
      </div>
    </main>
  );
}
