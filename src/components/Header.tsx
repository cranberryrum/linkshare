import React from 'react'
import { BrandMark } from './BrandMark'

export const Header: React.FC = () => {
  return (
    <header className="page-enter pt-6 pb-5 sm:py-8 px-4 sm:px-6" style={{ '--i': 0 } as React.CSSProperties}>
      <div className="max-w-5xl mx-auto flex justify-center">
        <a href="/" className="flex items-center gap-2" aria-label="linkshare.live home">
          <BrandMark size={20} className="text-blue-500" />
          <span className="text-xl font-extrabold tracking-[-0.02em] text-ink">
            linkshare<span className="text-blue-500">.live</span>
          </span>
        </a>
      </div>
    </header>
  )
}
