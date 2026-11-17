import React from 'react'
import { Heart, HelpCircle, Download } from 'lucide-react'
import { openGetApp } from '../lib/getApp'

export const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-4 text-center text-xs text-gray-500 border-t border-gray-200/70">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
          <div className="flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
            <span>by</span>
            <a
              href="https://adityakolte.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              adityakolte
            </a>
          </div>
          <div className="hidden sm:block h-4 w-px bg-gray-300" />
          <a
            href="https://www.producthunt.com/products/linkshare-live"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Upvote on Product Hunt
          </a>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => openGetApp('footer')}
            className="inline-flex items-center justify-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Get the app</span>
          </button>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <HelpCircle className="h-4 w-4" />
            <span>How it works</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
