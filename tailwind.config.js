/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        airbnb: {
          DEFAULT: '#FF385C',
          hover: '#E00B41',
          dark: '#D70466',
          light: '#FFF8F8',
          accent: '#FF5A5F',
        },
        dark: '#222222',
        secondary: '#717171',
        borderLight: '#DDDDDD',
        borderMuted: '#EBEBEB',
        bgLight: '#F7F7F7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'airbnb': '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'airbnb-hover': '0 6px 20px rgba(0,0,0,0.12)',
        'search': '0 3px 12px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.08)',
        'modal': '0 8px 28px rgba(0,0,0,0.28)',
      },
      screens: {
        'xs': '480px',
      }
    },
  },
  plugins: [],
}
