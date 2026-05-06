import { ButtonHTMLAttributes, ReactNode, memo } from "react";

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

function GoldButton({
  children,
  fullWidth = false,
  className = "",
  ...props
}: GoldButtonProps) {
  return (
    <button
      className={`
        touch-target inline-flex items-center justify-center
        rounded-full bg-gold px-8 py-3
        font-sans text-sm font-medium tracking-wide text-void
        transition-all duration-200 ease-out
        hover:brightness-110
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

export default memo(GoldButton);
