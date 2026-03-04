import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom logger that silences benign WebSocket proxy disconnect errors
const logger = createLogger()
const originalError = logger.error.bind(logger)
logger.error = (msg, options) => {
  if (typeof msg === 'string' && (msg.includes('ECONNABORTED') || msg.includes('ECONNRESET'))) return;
  originalError(msg, options)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  customLogger: logger,
  define: {
    global: 'window',
  },
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
      '/socket.io': {
        target: 'http://localhost:9092',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', () => { });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', () => { });
          });
        }
      }
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
      '/socket.io': {
        target: 'http://localhost:9092',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy preview error', err);
          });
        }
      }
    }
  }
})
