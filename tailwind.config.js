/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#111827',
          text: '#e5e7eb',
          prompt: '#22c55e'
        }
      }
    },
  },
  plugins: [],
}
