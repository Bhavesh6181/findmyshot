"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

interface UserMenuProps {
  name: string;
  image: string;
  showGreeting?: boolean;
}

export default function UserMenu({ name, image, showGreeting = false }: UserMenuProps) {
  const firstName = name?.split(" ")[0] || "User";

  return (
    <div className="flex items-center gap-3">
      {showGreeting && (
        <p className="font-sans text-[13px] text-gold">
          Hi, {firstName} 👋
        </p>
      )}

      {image && (
        <Image
          src={image}
          alt={name}
          width={32}
          height={32}
          className="rounded-full border border-gold/30"
        />
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="
          touch-target flex items-center gap-1.5
          rounded-full px-3 py-1.5
          font-sans text-[11px] tracking-wide text-muted
          transition-colors duration-200
          hover:text-gold
        "
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>
    </div>
  );
}
