/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#dbeafe',
          500: '#8B5CF6',
          600: '#7c3aed',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      }
    }
  },
  plugins: [],
  important: true
}
