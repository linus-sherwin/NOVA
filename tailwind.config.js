/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          light: "#F8FAFC",
          dark: "#0D1117",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#161B22",
        },
        surfaceSubtle: {
          light: "#F1F5F9",
          dark: "#21262D",
        },
        border: {
          light: "#E2E8F0",
          dark: "#30363D",
        },
        accent: {
          DEFAULT: "#007AFF",
          hover: "#0A84FF",
          subtle: "rgba(0, 122, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

