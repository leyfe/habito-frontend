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
    // Nur nötig für deine dynamischen Farbwerte (z. B. bg-${color}-500)
    {
      pattern: /((dark|hover|focus|active|disabled):)?(bg|text|border|ring|fill|stroke|from|via|to)-(blue|violet|pink|orange|green|teal|yellow|rose|slate|cyan|lime|purple|neutral)-(100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /(dark:)?(from|to)-(rose|violet|emerald|amber|blue|neutral)-(800|900|950)/
    }
  ],

  theme: {
    extend: {},
  },

  plugins: [nextui({ addCommonColors: true })],
};