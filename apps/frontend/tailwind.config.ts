import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#edf5ff',
          100: '#d7e9ff',
          700: '#07508f',
          800: '#063b6a',
          900: '#032f55',
          950: '#002b4f'
        },
        safe: '#1fa67a',
        critical: '#e84b4b',
        warning: '#f5a623'
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0, 43, 79, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
