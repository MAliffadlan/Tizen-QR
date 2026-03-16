/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'samsung-blue': '#1428a0',
        'remote-bg': '#1e1e1e',
        'remote-surface': '#252526',
        'netflix-red': '#E50914',
        'youtube-red': '#FF0000',
      },
      boxShadow: {
        'neumorphic-outer': '6px 6px 12px #151515, -6px -6px 12px #2b2b2b',
        'neumorphic-inner': 'inset 4px 4px 8px #151515, inset -4px -4px 8px #2b2b2b',
        'dpad-outer': '8px 8px 16px #121212, -8px -8px 16px #2e2e2e',
        'rocker-outer': '5px 5px 10px #151515, -5px -5px 10px #2b2b2b',
      },
      backgroundImage: {
        'brushed-metal': 'linear-gradient(135deg, #2a2a2b 0%, #1e1e1e 100%)',
      }
    },
  },
  plugins: [],
}
