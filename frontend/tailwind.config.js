/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        accent: '#7c5cff',
        accent2: '#ff7ab6',
        coach: '#26d986',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cabinet Grotesk"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
