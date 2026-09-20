/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Indic Theme Palette: White & Saffron/Orange with Marigold & Gold Accents
        saffron: {
          50: '#fff8f1',
          100: '#feeee2',
          200: '#fddbc3',
          300: '#fbbd97',
          400: '#f79364',
          500: '#ff7700', // Primary Indic Saffron
          600: '#e65100', // Deep Saffron / Kesari
          700: '#c23c02',
          800: '#9b3009',
          900: '#7c290c',
          950: '#431204',
        },
        marigold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        temple: {
          bg: '#F8F5EF',
          card: '#FFFCF7',
          sidebar: '#24211D',
          sidebarHover: '#332D27',
          sandalwood: '#F0E9DF',
          border: '#E5DED2',
          gold: '#B88A3B',
          vermilion: '#B84A43',
          sacredGreen: '#287C78',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Manrope', 'Avenir Next', 'sans-serif'],
      },
      boxShadow: {
        'indic': '0 4px 20px -2px rgba(230, 81, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'indic-lg': '0 10px 25px -3px rgba(230, 81, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
