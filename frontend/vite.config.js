import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ['./index.html', './src/**/*.{js,jsx}'],
          theme: {
            extend: {
              colors: {
                primary: {
                  50:  '#ecfdf5',
                  100: '#d1fae5',
                  200: '#a7f3d0',
                  300: '#6ee7b7',
                  400: '#34d399',
                  500: '#10b981',
                  600: '#059669',
                  700: '#047857',
                  800: '#065f46',
                  900: '#064e3b',
                  950: '#022c22',
                },
              },
              fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
            },
          },
          plugins: [],
        }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/media': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
