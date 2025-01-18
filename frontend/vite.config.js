import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure assets are served from root
  build: {
    outDir: 'dist', // Explicitly set output directory
    emptyOutDir: true // Clear the output directory before building
  }
})
