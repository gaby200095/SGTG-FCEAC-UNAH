module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F766E',
          600: '#0E645E',
          700: '#0C524D',
        },
        unah: {
          DEFAULT: '#1e3a8a',
          700: '#183474',
          600: '#274190',
          gold: '#facc15',
          goldDark: '#eab308'
        },
        surface: '#F8FAFC',
        border:  '#E2E8F0',
        error:   '#B91C1C',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
};