import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a5f",
          50: "#eef3f8",
          100: "#d3e0ed",
          200: "#a7c1db",
          300: "#7ba3c9",
          400: "#4f84b7",
          500: "#356897",
          600: "#2a5378",
          700: "#1e3a5f",
          800: "#162b46",
          900: "#0e1d30",
        },
        gold: {
          DEFAULT: "#d4af37",
          50: "#faf6e9",
          100: "#f3e9c4",
          200: "#e9d488",
          300: "#dec153",
          400: "#d4af37",
          500: "#b8942a",
          600: "#937322",
          700: "#6e561a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(30, 58, 95, 0.08), 0 1px 2px -1px rgba(30, 58, 95, 0.06)",
        "card-hover": "0 10px 25px -5px rgba(30, 58, 95, 0.12), 0 8px 10px -6px rgba(30, 58, 95, 0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
