/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
      },
      colors: {
        blue: {
          300: '#93C5FD',
          500: '#3B82F6',
          600: '#2563EB',
        },
        gray: {
          50: '#F9FAFB',
          200: '#E5E7EB',
          400: '#9CA3AF',
          700: '#374151',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};