/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        app: {
          blue: '#007AFF',
          'blue-hover': '#0066DD',
          'blue-muted': 'rgba(0, 122, 255, 0.12)',
          border: 'rgba(0, 0, 0, 0.08)',
          'border-strong': 'rgba(0, 0, 0, 0.12)',
          surface: 'rgba(255, 255, 255, 0.72)',
          'surface-elevated': 'rgba(255, 255, 255, 0.88)',
          'text-primary': '#1C1C1E',
          'text-secondary': '#6C6C70',
          'text-tertiary': '#AEAEB2',
          scrim: 'rgba(0, 0, 0, 0.32)',
          success: '#34C759',
          error: '#FF3B30',
        },
      },
      borderRadius: {
        app: '16px',
        'app-button': '12px',
        'app-input': '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08)',
        pill: '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      transitionTimingFunction: {
        'ease-out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
