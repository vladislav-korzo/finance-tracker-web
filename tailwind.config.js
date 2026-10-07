import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kumbh Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': 'calc(var(--radius) + 6px)',
        xl: 'calc(var(--radius) + 2px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 7px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'surface-2': 'hsl(var(--surface-2))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        hero: {
          DEFAULT: 'hsl(var(--hero))',
          foreground: 'hsl(var(--hero-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
          6: 'hsl(var(--chart-6))',
        },
        income: {
          DEFAULT: 'hsl(var(--income))',
          foreground: 'hsl(var(--income-foreground))',
        },
        expense: {
          DEFAULT: 'hsl(var(--expense))',
          foreground: 'hsl(var(--expense-foreground))',
        },
      },
      boxShadow: {
        xs: '0 1px 2px hsl(var(--shadow-color) / 0.06)',
        card: '0 1px 2px hsl(var(--shadow-color) / 0.06), 0 8px 24px -12px hsl(var(--shadow-color) / 0.14)',
        'card-hover':
          '0 2px 4px hsl(var(--shadow-color) / 0.08), 0 18px 40px -16px hsl(var(--shadow-color) / 0.26)',
        floating:
          '0 12px 48px -12px hsl(var(--shadow-color) / 0.3), 0 4px 12px -6px hsl(var(--shadow-color) / 0.2)',
        glow: '0 6px 24px -6px hsl(var(--primary) / 0.5)',
        'glow-lg': '0 10px 40px -8px hsl(var(--primary) / 0.55)',
        'inner-top': 'inset 0 1px 0 0 hsl(0 0% 100% / 0.06)',
      },
      backgroundImage: {
        'hero-sheen':
          'radial-gradient(120% 120% at 0% 0%, hsl(var(--primary) / 0.22), transparent 45%), radial-gradient(120% 120% at 100% 100%, hsl(var(--chart-3) / 0.2), transparent 50%)',
        'primary-gradient': 'linear-gradient(135deg, hsl(var(--primary)), hsl(72 90% 64%))',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.45)' },
          '50%': { boxShadow: '0 0 0 10px hsl(var(--primary) / 0)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -2%, 0) scale(1.08)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-out infinite',
        aurora: 'aurora 14s ease-in-out infinite',
        'spin-slow': 'spin-slow 1.1s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
