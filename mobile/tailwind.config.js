/** @type {import('tailwindcss').Config} */
const hsl = (v) => `hsl(var(${v}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        // Weight→family mapping is handled by the <Text> primitive (RN custom
        // fonts need a distinct family per weight). Inter = full Cyrillic +
        // tabular figures. `font-sans` = the regular face.
        sans: ['Inter_400Regular'],
      },
      borderRadius: {
        sm: '7px',
        md: '10px',
        lg: '14px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
        full: '9999px',
      },
      colors: {
        background: hsl('--background'),
        foreground: hsl('--foreground'),
        'surface-2': hsl('--surface-2'),
        card: { DEFAULT: hsl('--card'), foreground: hsl('--card-foreground') },
        popover: { DEFAULT: hsl('--popover'), foreground: hsl('--popover-foreground') },
        primary: { DEFAULT: hsl('--primary'), foreground: hsl('--primary-foreground') },
        secondary: { DEFAULT: hsl('--secondary'), foreground: hsl('--secondary-foreground') },
        muted: { DEFAULT: hsl('--muted'), foreground: hsl('--muted-foreground') },
        accent: { DEFAULT: hsl('--accent'), foreground: hsl('--accent-foreground') },
        destructive: { DEFAULT: hsl('--destructive'), foreground: hsl('--destructive-foreground') },
        border: hsl('--border'),
        input: hsl('--input'),
        ring: hsl('--ring'),
        hero: { DEFAULT: hsl('--hero'), foreground: hsl('--hero-foreground') },
        income: { DEFAULT: hsl('--income'), foreground: hsl('--income-foreground') },
        expense: { DEFAULT: hsl('--expense'), foreground: hsl('--expense-foreground') },
        chart: {
          1: hsl('--chart-1'),
          2: hsl('--chart-2'),
          3: hsl('--chart-3'),
          4: hsl('--chart-4'),
          5: hsl('--chart-5'),
          6: hsl('--chart-6'),
        },
      },
    },
  },
  plugins: [],
};
