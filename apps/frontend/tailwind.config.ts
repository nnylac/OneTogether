import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
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
        warning: '#f5a623',
        sgds: {
          purple: '#5925DC',
          'purple-dark': '#4318B8',
          'purple-light': '#F3EFFE',
          'purple-mid': '#EDE0FC',
          gray: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#6C757D',
            700: '#495057',
            800: '#343A40',
            900: '#212529'
          },
          red: '#C0392B',
          green: '#0A8217',
          amber: '#F39C12',
          blue: '#1B6EC2'
        },
        eoc: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          text: '#e2e8f0',
          dim: '#94a3b8',
          cyan: '#22d3ee',
          amber: '#fbbf24',
          red: '#f87171',
          green: '#4ade80'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0, 43, 79, 0.08)',
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
      }
    }
  },
  plugins: []
} satisfies Config;
