import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { applyReadingSize, readReadingSize } from './lib/readingSize'

// Taille du texte persistée : appliquée avant le premier rendu (chantier 8)
applyReadingSize(readReadingSize())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* basename déduit du base path de build (GitHub Pages = sous-chemin, sinon racine) */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
