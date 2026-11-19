/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Unified Guzel Medical Spa Blush, Lilac, Plum & Luminous White Palette
        ivory: '#f9f0f5',
        cream: '#f3e6f0',
        pearl: '#e8d7e4',
        blush: {
          50: '#fdf8fb',
          100: '#f9f0f5',
          200: '#f3e6f0',
          300: '#e58fb6',
          400: '#d96b9e',
          500: '#c24d84',
          600: '#9e3668',
        },
        rosegold: {
          50: '#f7f2fc',
          100: '#ecdcef',
          200: '#dcc8f4',
          300: '#cbb6ea',
          400: '#b14bd9',
          500: '#9333ea',
          600: '#7e22ce',
        },
        champagne: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#cbb6ea',
          400: '#b14bd9',
        },
        mocha: {
          400: '#8a6d94',
          500: '#6c4f77',
          600: '#53375e',
          700: '#3a1d43',
        },
        espresso: '#3a1d43',
        ink: '#25142d',
      },
      fontFamily: {
        display: [
          '"Cairo"',
          '"Noto Kufi Arabic"',
          '"Tajawal"',
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          '"Tajawal"',
          '"Noto Sans Arabic"',
          '"Cairo"',
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        serif: [
          '"Amiri"',
          '"Noto Naskh Arabic"',
          '"Instrument Serif"',
          'Georgia',
          'serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      letterSpacing: {
        'wider-2': '0.12em',
        'wider-3': '0.2em',
      },
      boxShadow: {
        soft: '0 14px 44px -18px rgba(58, 29, 67, 0.14)',
        softer: '0 8px 28px -12px rgba(58, 29, 67, 0.09)',
        clean: '0 4px 20px -2px rgba(58, 29, 67, 0.06)',
        'inner-soft': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
