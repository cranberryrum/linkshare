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
        <main className="flex-grow flex items-center justify-center p-4">
          <MainContent />
        </main>
        <Footer />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #E3E3E3',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: '12px 16px'
            },
            className: 'my-toast-class'
          }}
          closeButton
        />
      </div>
    </LinkProvider>
  )
}

export default App