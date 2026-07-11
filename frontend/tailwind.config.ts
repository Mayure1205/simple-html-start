import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Midnight Indigo semantic tokens (HSL-friendly hexes)
        ink: {
          950: "#06060f",
          900: "#0a0a1a",
          800: "#0f0f24",
          700: "#141432",
          600: "#1c1c46",
          500: "#1e1e5a",
        },
        indigo: {
          glow: "#8b5cf6",
          bright: "#6366f1",
          core: "#4f46e5",
          deep: "#3730a3",
        },
        mist: {
          50: "#eef0ff",
          200: "#c7ccf5",
          400: "#8b93c9",
          600: "#5b6394",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(79,70,229,0.55)",
        panel: "0 10px 40px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(79,70,229,0.18), transparent 60%), radial-gradient(ellipse at bottom right, rgba(139,92,246,0.12), transparent 55%)",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
