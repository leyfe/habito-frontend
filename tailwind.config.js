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
  { pattern: /bg-(blue|violet|pink|orange|green|teal|yellow|rose|slate|cyan|lime|purple)-(100|200|300|400|500|600|700|800)/ },
  { pattern: /from-(blue|violet|pink|orange|green|teal|yellow|rose|slate|cyan|lime|purple)-(100|200|300|400|500|600|700|800)/ },
  { pattern: /to-(blue|violet|pink|orange|green|teal|yellow|rose|slate|cyan|lime|purple)-(100|200|300|400|500|600|700|800)/ },
  ],
  theme: { extend: {} },
  darkMode: "class",
  plugins: [nextui()],
};