/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ntc-blue': '#003893',
        'ntc-red': '#E31837',
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
