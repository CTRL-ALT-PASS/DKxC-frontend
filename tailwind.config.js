/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        darcy: { DEFAULT: "#1F3D2B", dark: "#14291C", light: "#2F5A3F" },
        cream: "#F5F1E8",
        warn: "#DC2626",
      },
    },
  },
  plugins: [],
};