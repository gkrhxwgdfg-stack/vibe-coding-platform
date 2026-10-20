import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // Base path configurable :
  // - '/' par défaut (Netlify, Vercel, racine)
  // - '/vibe-coding-platform/sivia/' pour GitHub Pages (sous-chemin du dépôt)
  base: process.env.SIVIA_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
