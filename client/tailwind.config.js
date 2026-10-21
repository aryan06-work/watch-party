/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          bg: '#0B0F17',
          surface: '#131B2A',
          card: '#1B2436',
          border: '#26334B',
          muted: '#8E9BAE'
        }
      },
      animation: {
        'float-up': 'floatUp 2.5s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '50%': { transform: 'translateY(-60px) scale(1.2)', opacity: '0.9' },
          '100%': { transform: 'translateY(-140px) scale(1)', opacity: '0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
