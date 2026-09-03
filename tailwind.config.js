/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0D0F',
          900: '#111417',
          800: '#181C20',
          700: '#22272C',
          600: '#2E353B',
          500: '#3E464D',
          400: '#5C666D',
          300: '#8C969D',
          200: '#B9C1C6',
          100: '#E4E8EA',
        },
        amber: {
          50: '#FBF3E4',
          100: '#F4E2BE',
          300: '#E7BD7C',
          400: '#DDA75B',
          500: '#CE9143',
          600: '#AD7735',
          700: '#875D2A',
        },
        signal: {
          leak: '#C9634D',
          recover: '#5FA987',
          pending: '#DDA75B',
          escalate: '#8C7BC2',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        rise: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease-out both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
