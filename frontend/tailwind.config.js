/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Palette principale NoamHome — vert émeraude chaleureux
        noam: {
          50:  '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d2',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Couleur d'accent — or chaud
        or: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Alias pour compatibilité avec les classes existantes
        primary: {
          50:  '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d2',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        brand: {
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      borderRadius: {
        xl:  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'noam': '0 4px 24px -4px rgba(22, 163, 74, 0.18)',
        'noam-lg': '0 8px 40px -8px rgba(22, 163, 74, 0.22)',
        'card': '0 2px 16px -2px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px -4px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
