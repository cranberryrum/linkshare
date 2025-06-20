/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
      },
      colors: {
        'app-blue': '#3B82F6',
        'app-background': '#F8F9FA',
        'app-border': '#E3E3E3',
        'app-card': '#FFFFFF',
        'app-text': {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        },
      },
      boxShadow: {
        'app': '0 2px 8px rgba(0,0,0,0.06)',
        'app-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'app': '16px',
        'app-button': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};