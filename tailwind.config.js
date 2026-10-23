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
        // Existing classes (bg-primary, text-tertiary, ...) keep working.
        primary: { DEFAULT: "#BE185D", bright: "#E11D48" },
        secondary: "#4C0519",
        tertiary: { DEFAULT: "#FB7185", soft: "#FDA4AF" },
        neutral: "#FFF1F2",
        warn: "#DC2626",

        // New, reusable on other pages
        canvas: { DEFAULT: "#1A0208", mid: "#2A030F" }, // dark page backgrounds
        field: "#3A1220", // input / card surface on dark backgrounds
        success: "#34D399", // online / confirmed indicators

        // Previous (green) version, kept so other screens don't break
        darcy: { DEFAULT: "#1F3D2B", dark: "#14291C", light: "#2F5A3F" },
        cream: "#F5F1E8",
      },
    },
  },
  plugins: [],
};
