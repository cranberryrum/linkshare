import React from 'react'
import { LinkProvider } from './contexts/LinkContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MainContent } from './components/MainContent'
import { Toaster } from 'sonner'

function App() {
  return (
    <LinkProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4 py-6">
          <MainContent />
        </main>
        <Footer />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              padding: '12px 16px',
              fontSize: '14px',
            },
          }}
          closeButton
        />
      </div>
    </LinkProvider>
  )
}

export default App
