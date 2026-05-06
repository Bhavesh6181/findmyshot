import { ButtonHTMLAttributes, ReactNode, memo } from "react";

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

function GhostButton({
  children,
  fullWidth = false,
  className = "",
  ...props
}: GhostButtonProps) {
  return (
    <button
      className={`
        touch-target inline-flex items-center justify-center
        rounded-full border border-gold/40 bg-transparent
        px-8 py-3
        font-sans text-sm font-medium tracking-wide text-gold
        transition-all duration-200 ease-out
        hover:bg-gold/5
        active:scale-95
        disabled:cursor-not-allowed disabled:opacity-40
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default memo(GhostButton);
