const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,jsx,ts,tsx}",
  ],

  safelist: [
    {
      // Alle dynamischen Farb-Utilities (bg, text, border, gradients etc.)
      pattern:
        /((dark|hover|focus|active|disabled):)?(bg|text|border|ring|fill|stroke|from|via|to)-(sky|violet|rose|emerald|amber|blue|neutral)-(100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      // Speziell für dunkle Gradients (z. B. dark:to-emerald-950/30)
      pattern:
        /(dark:)?(from|via|to)-(sky|violet|rose|emerald|amber|blue|neutral)-(800|900|950)/,
    },
  ],

  theme: {
    extend: {},
  },

  plugins: [nextui({ addCommonColors: true })],
};