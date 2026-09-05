/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#09090b',
          900: '#121215',
          850: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        hairline: 'rgba(255, 255, 255, 0.07)',
      },
    },
  },
  plugins: [],
}
