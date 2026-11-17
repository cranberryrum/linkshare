import type React from 'react'
import { LinkProvider } from './contexts/LinkContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MainContent } from './components/MainContent'
import { PageContent } from './components/PageContent'
import { Page } from './content/pages'
import { Toaster } from 'sonner'

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
          <p className="page-enter -mt-2 px-4 text-center" style={{ '--i': 3 } as React.CSSProperties}>
            <a
              href="#get-linkshare"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Get Linkshare on your phone or browser
              <span aria-hidden>↓</span>
            </a>
          </p>
          <PageContent page={page} />
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