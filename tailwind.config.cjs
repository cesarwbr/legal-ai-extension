/** @type {import('tailwindcss').Config} */
module.exports = {
  important: '#extension-root',
  content: [
    "./content-script/**/*.{js,ts,jsx,tsx}",
    "./sidepanel/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      padding: '2rem',
    },
    extend: {
      animation: {
        'pulse-green': 'pulse-green 2s infinite'
      },
      keyframes: {
        'pulse-green': {
          '0%': {
            'box-shadow': '0 0 0 0 rgba(60, 179, 113, 0.7)'
          },
          '70%': {
            'box-shadow': '0 0 0 10px rgba(60, 179, 113, 0)'
          },
          '100%': {
            'box-shadow': '0 0 0 0 rgba(60, 179, 113, 0)'
          }
        }
      }
    }
  }
}
