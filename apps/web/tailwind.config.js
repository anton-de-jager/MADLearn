/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FFF4EB',
          100:  '#FFEAD6',
          200:  '#FFD5AD',
          300:  '#FFBA7A',
          400:  '#FF9B3D',
          500:  '#FF7B00',
          600:  '#E06C00',
          700:  '#C25D00',
          800:  '#9E4C00',
          900:  '#753900',
          950:  '#4D2500',
        },
        secondary: {
          50:  '#FFEFEB',
          100:  '#FFE0D6',
          200:  '#FFC1AD',
          300:  '#FF9A7A',
          400:  '#FF6C3D',
          500:  '#FF3D00',
          600:  '#E03600',
          700:  '#C22E00',
          800:  '#9E2600',
          900:  '#751C00',
          950:  '#4D1200',
        }
      }
    }
  },
  plugins: [],
  important: true
}
