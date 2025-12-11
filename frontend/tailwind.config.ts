import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // #0099ff from https://www.w3schools.com/colors/colors_picker.asp
        "stats-blue-0": "#eff9ff",
        "stats-blue-50": "#e6f5ff",
        "stats-blue-100": "#b3e0ff",
        "stats-blue-200": "#99d6ff",
        "stats-blue-300": "#80ccff",
        "stats-blue-400": "#66c2ff",
        "stats-blue-500": "#4db8ff",
        "stats-blue-550": "#33adff",
        "stats-blue-600": "#0099ff",
        "stats-blue-700": "#007acc",
        "stats-blue-750": "#006bb3",
        "stats-blue-800": "#005c99",
        "stats-blue-900": "#003d66",
        "stats-blue-950": "#002e4d",
        "stats-blue-1000": "#001f33",
        "stats-blue-1050": "#000f1a",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
