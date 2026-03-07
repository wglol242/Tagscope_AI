const defaultTheme = require('tailwindcss/defaultTheme');

/* @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      fontFamily: {
        'bruno-ace': ['"Bruno Ace"', 'sans-serif'], 
        sans: ["'Chiron GoRound TC'", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        grayBg: '#f4f4f4', // Light background
        grayText: '#1a1a1a', // Light text
      },
      boxShadow: {
        subtle: '2px 2px 0 0 #000',
      },
    },
  },
  plugins: [],
}