/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        emerald: { 400: "#34d399", 500: "#10b981", 600: "#059669" },
        violet: { 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed" },
        amber: { 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706" },
        cyan: { 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2" },
        rose: { 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48" },
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
