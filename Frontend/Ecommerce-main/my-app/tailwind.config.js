/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6e7051',
          hover: '#5a5c42',
        },
        dark: {
          DEFAULT: '#262b2c',
          light: '#3a4042',
        },
        light: {
          DEFAULT: '#f1f1ef',
          dark: '#e5e5e5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

