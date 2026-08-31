import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api':          'http://localhost:7020',
      '/autodiscover': 'http://localhost:7020',
      '/device':       'http://localhost:7020',
      '/devices':      'http://localhost:7020',
      '/ir':           'http://localhost:7020',
      '/rf':           'http://localhost:7020',
      '/command':      'http://localhost:7020',
      '/temperature':  'http://localhost:7020',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
