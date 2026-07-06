import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A1730",     // near-black navy, headers/nav
        navy: "#0F1E3D",    // primary brand navy (from logo)
        navy2: "#16294D",   // lighter navy for hover/panels
        paper: "#FBFAF7",   // warm white background
        sand: "#C9A227",    // gold accent (from logo emblem)
        sand2: "#E4CE8C",   // pale gold for subtle fills
        line: "#E2E0D8",    // hairline dividers
        muted: "#6B7280",   // secondary text
        danger: "#B3261E",
        success: "#1E6B3D",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        arch: "999px 999px 4px 4px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,30,61,0.06), 0 8px 24px rgba(15,30,61,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
