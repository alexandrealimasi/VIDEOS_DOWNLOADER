/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f0f13',
          card: '#1a1a24',
          hover: '#242433',
        },
        accent: {
          DEFAULT: '#7c5cfc',
          hover: '#6a4ce0',
          light: '#9b82fc',
        },
        border: {
          DEFAULT: '#2a2a3a',
        },
      },
    },
  },
  plugins: [],
}
