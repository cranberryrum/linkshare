import type React from 'react'
import { LinkProvider } from './contexts/LinkContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MainContent } from './components/MainContent'
import { PageContent } from './components/PageContent'
import { Page } from './content/pages'
import { Toaster } from 'sonner'
import { Smartphone } from 'lucide-react'
import { GetAppModal } from './components/GetAppModal'
import { openGetApp } from './lib/getApp'

function App({ page }: { page: Page }) {
  return (
    <LinkProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          {/* Fixed rhythm, not viewport-centred: the tool always sits the same
              distance under the intro, on short phones and tall monitors alike. */}
          <Header />
          <div className="page-enter px-4 text-center" style={{ '--i': 0.5 } as React.CSSProperties}>
            <h1 className="mx-auto max-w-2xl text-[22px] leading-tight sm:text-[28px] font-extrabold tracking-[-0.025em] text-ink text-balance">
              {page.h1}
            </h1>
            <p className="mt-1.5 sm:mt-2 mx-auto max-w-sm text-sm leading-relaxed text-gray-500 text-pretty">
              {page.intro}
            </p>
          </div>
          <div className="flex justify-center px-4 pt-1 sm:pt-4 pb-4">
            <MainContent />
          </div>
          <div className="page-enter -mt-1 flex justify-center px-4" style={{ '--i': 3 } as React.CSSProperties}>
            <button
              onClick={() => openGetApp('under_tool')}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Get the app
            </button>
          </div>
          <PageContent page={page} />
        </main>
        <Footer />
        <GetAppModal />
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