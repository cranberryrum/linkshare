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
        sans: ['"Figtree Variable"', 'Figtree', 'system-ui', 'sans-serif'],
        // Codes and countdowns: every digit the same width, reads like a code
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Brand "Signal": one indigo-blue ramp, so every blue in the app moves together
        blue: {
          50: '#EEF1FF',
          100: '#DCE2FF',
          200: '#C2CBFF',
          300: '#9AA9FF',
          400: '#6E84FF',
          500: '#3D5AFE',
          600: '#3049E0',
          700: '#2A3FC2',
        },
        ink: '#0B1020',
        gray: {
          50: '#F9FAFB',
          200: '#E5E7EB',
          400: '#9CA3AF',
          700: '#374151',
        },
        // App tokens used across components (were referenced but never defined)
        app: {
          blue: '#3D5AFE',
          'text-primary': '#0B1020',
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