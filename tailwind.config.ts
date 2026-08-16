import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF9FC",
        ink: "#1F1B2E",
        navy: {
          50: "#F1F1F7",
          100: "#DEDCEC",
          300: "#9C96C4",
          500: "#4E4785",
          700: "#2D2A4A",
          900: "#181731",
        },
        lilac: {
          50: "#F6F4FD",
          100: "#EAE6FA",
          200: "#D6CDF5",
          300: "#BCA9EE",
          400: "#A489E6",
          500: "#8B6FDB",
        },
        anxious: "#C97B84",
        avoidant: "#5D80AE",
        secure: "#5FA88C",
        sand: "#F1EFE9",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(45, 42, 74, 0.12)",
        card: "0 2px 12px -4px rgba(45, 42, 74, 0.08)",
      },
      backgroundImage: {
        "aurora": "radial-gradient(ellipse at top left, #EAE6FA 0%, transparent 55%), radial-gradient(ellipse at bottom right, #F1F1F7 0%, transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
