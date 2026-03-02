import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        xfwd: true,
        bypass: (req) => {
          if (req.url?.startsWith('/oauth2/redirect')) {
            return req.url; // Let Vite handle it directly (pass to React Router)
          }
        }
      },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true, xfwd: true },
      '/socket.io': { target: 'http://localhost:9092', ws: true, changeOrigin: true, secure: false }
    },
    allowedHosts: true
  },
  preview: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        xfwd: true,
        bypass: (req) => {
          if (req.url?.startsWith('/oauth2/redirect')) {
            return req.url; // Let Vite handle it directly (pass to React Router)
          }
        }
      },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true, xfwd: true },
      '/socket.io': { target: 'http://localhost:9092', ws: true, changeOrigin: true, secure: false }
    }
  }
})
