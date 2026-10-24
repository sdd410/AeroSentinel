/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B111E',
        panel: '#111A2E',
        'panel-accent': '#18243E',
        'panel-border': '#1F3054',
        accent: {
          cyan: '#00F0FF',
          blue: '#3B82F6',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
