/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#C0392B', hover: '#A93226' },
        secondary: { DEFAULT: '#E74C3C', hover: '#CB4335' },
        dark:      { DEFAULT: '#1A1A2E', light: '#2D2D4E' },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        heading: ['Montserrat', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
