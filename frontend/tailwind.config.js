/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6C63FF',
          50: '#f0effe',
          100: '#e4e2fd',
          200: '#ccc8fb',
          300: '#aaa3f8',
          400: '#8880f3',
          500: '#6C63FF',
          600: '#5a4cf0',
          700: '#4a3bd8',
          800: '#3e32b0',
          900: '#342d8e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
