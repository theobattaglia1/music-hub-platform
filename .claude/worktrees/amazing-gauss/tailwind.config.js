/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Design system tokens wired into Tailwind ── */
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        border:  'var(--color-border)',
        accent:  {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          subtle:  'var(--color-accent-subtle)',
        },
        text: {
          DEFAULT:   'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          inverse:   'var(--color-text-inverse)',
        },

        /* Legacy palette kept for backward compat */
        primary: {
          50:  '#fef7ee',
          100: '#fdedd3',
          200: '#fbd6a5',
          300: '#f8b86d',
          400: '#f59132',
          500: '#C84B11',   /* updated to match accent */
          600: '#A83A0C',
          700: '#8a2e08',
          800: '#702606',
          900: '#5c2005',
        },
        dark: {
          50:  '#F4F3F0',
          100: '#EDECE9',
          200: '#E0DED9',
          300: '#C8C5BF',
          400: '#9E9A95',
          500: '#6B6762',
          600: '#48443F',
          700: '#2C2B28',
          800: '#1A1918',
          900: '#131211',
          950: '#0A0A09',
        },
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Icons',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'monospace',
        ],
      },

      fontSize: {
        'display':    ['var(--text-display)',    { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading':    ['var(--text-heading)',    { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'subheading': ['var(--text-subheading)', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
        'body':       ['var(--text-body)',       { lineHeight: '1.5' }],
        'small':      ['var(--text-small)',      { lineHeight: '1.4' }],
        'caption':    ['var(--text-caption)',    { lineHeight: '1.3', letterSpacing: '0.06em' }],
        'utility':    ['var(--text-utility)',    { lineHeight: '1.3', letterSpacing: '0.1em' }],
      },

      spacing: {
        '1':  'var(--space-1)',
        '2':  'var(--space-2)',
        '3':  'var(--space-3)',
        '4':  'var(--space-4)',
        '5':  'var(--space-5)',
        '6':  'var(--space-6)',
        '8':  'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
      },

      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        DEFAULT: 'var(--radius-md)',
      },

      boxShadow: {
        'sm':      'var(--shadow-sm)',
        'md':      'var(--shadow-md)',
        'lg':      'var(--shadow-lg)',
        'overlay': 'var(--shadow-overlay)',
        DEFAULT:   'var(--shadow-sm)',
      },

      transitionDuration: {
        'fast':    '150',
        'default': '200',
        'slow':    '300',
      },

      animation: {
        'fade-in':   'fadeIn 200ms ease-out',
        'slide-up':  'slideUp 200ms ease-out',
        'slide-down':'slideDown 200ms ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '12px',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
