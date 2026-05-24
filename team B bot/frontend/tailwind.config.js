/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ssb: {
          // Official SSB Brand Colors
          blue: '#3098cc',           // Primary Blue
          orange: '#feb74f',         // Secondary Orange/Gold
          navy: '#1a202c',           // Dark Navy
          slate: '#1c4861',          // Dark Slate
          teal: '#008FA4',           // Accent Teal
          gray: '#f8f8f8',           // Light Gray
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'Proxima Nova', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Bitter', 'Georgia', 'serif'],
        display: ['Europa', 'Open Sans', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
      },
      borderRadius: {
        'ssb': '50px',
      },
    },
  },
  plugins: [],
}
