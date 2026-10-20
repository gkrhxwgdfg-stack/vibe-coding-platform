import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // L'app est servie sous /vibe-coding-platform/sivia/ (GitHub Pages, dépôt non-root)
  base: '/vibe-coding-platform/sivia/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
