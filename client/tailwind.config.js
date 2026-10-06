/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saathi: {
          dark: '#0B1120',
          card: '#1E293B',
          accent: '#F59E0B',
          green: '#10B981',
          blue: '#3B82F6',
          purple: '#8B5CF6'
        },
        contrast: {
          black: '#000000',
          white: '#FFFFFF',
          yellow: '#FFEE00',
          cyan: '#00E5FF',
          lime: '#39FF14'
        }
      },
      fontSize: {
        '2xs': '0.65rem',
        'touch': '1.35rem',
      },
      boxShadow: {
        'high-contrast': '0 0 0 4px #FFEE00',
        'tactile': '0 6px 0 rgba(0,0,0,0.4)',
        'tactile-pressed': '0 2px 0 rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
