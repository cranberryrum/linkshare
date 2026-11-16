/** @type {import('tailwindcss').Config} */
export default {
  // hover: styles only on devices that really hover (no sticky hover after a tap on phones)
  future: {
    hoverOnlyWhenSupported: true,
  },
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
        },
        // App tokens used across components (were referenced but never defined)
        app: {
          blue: '#3B82F6',
          'text-primary': '#111827',
          'text-secondary': '#6B7280',
          border: '#E5E7EB',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        'app-button': '12px',
      },
    },
  },
  plugins: [],
};