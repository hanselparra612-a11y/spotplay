import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Permite conexiones desde túneles externos (Cloudflare, etc.)
    cors: true,
    watch: {
      ignored: ['**/android/**', '**/dist/**', '**/public/uploads/**'],
    },
    proxy: {
      '/v/': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: false,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/videos': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
