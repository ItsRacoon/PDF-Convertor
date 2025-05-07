import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure PDF.js worker is properly handled
      'pdfjs-dist': resolve(__dirname, 'node_modules/pdfjs-dist')
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.entry']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist', 'pdfjs-dist/build/pdf.worker.entry']
        }
      }
    }
  }
})
