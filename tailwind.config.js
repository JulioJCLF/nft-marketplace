/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0E0C0A',
        surface: {
          DEFAULT: '#18120E',
          secondary: '#221914',
          tertiary: '#2D201A',
          hover: '#291F18',
        },
        primary: {
          DEFAULT: '#D08848',
          hover: '#E59A5A',
          active: '#B87236',
          foreground: '#0E0C0A',
        },
        border: {
          DEFAULT: '#2F231B',
          light: '#3F3025',
          focus: '#D08848',
        },
        foreground: {
          DEFAULT: '#F8F5F0',
          muted: '#9E9186',
          subtle: '#73675E',
        },
        card: {
          DEFAULT: '#18120E',
          foreground: '#F8F5F0',
        },
        popover: {
          DEFAULT: '#1E1611',
          foreground: '#F8F5F0',
        },
        accent: {
          DEFAULT: '#D08848',
          foreground: '#0E0C0A',
          green: '#10B981',
          red: '#EF4444',
          yellow: '#F59E0B',
        },
        muted: {
          DEFAULT: '#261C16',
          foreground: '#9E9186',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Figma Mono', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
