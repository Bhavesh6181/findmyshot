import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0D0D0D",
        surface: "#111827",
        card: "#1a1a2e",
        gold: "#C9A96E",
        ivory: "#F5F0E8",
        muted: "#8a8a8a",
        faded: "#555555",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["Segoe UI", "Inter", "Arial", "sans-serif"],
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.02)" },
        },
        "dot-pulse": {
          "0%, 80%, 100%": { opacity: "0.2" },
          "40%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.5s ease-in-out infinite",
        "dot-pulse": "dot-pulse 1.4s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
