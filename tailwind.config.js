/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#d89b22',
        secondary: '#cacbaf',
        background: '#1E1E1E',
        surface: '#252525',
        border: '#2A2A2A',
      }
    },
  },
  plugins: [],
};
