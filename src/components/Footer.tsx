import React, { useState } from 'react'
import { Heart, HelpCircle, X } from 'lucide-react'

export const Footer: React.FC = () => {
  const [showModal, setShowModal] = useState(false)

  const handleHowItWorks = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    setShowModal(true)
  }

  return (
    <>
      <footer className="py-4 px-4 text-center text-sm text-app-text-secondary">
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
                className="text-app-blue hover:underline"
              >
                adityakolte
              </a>
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-300" />
            <a 
              href="https://www.producthunt.com/products/linkshare-live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-app-blue hover:underline"
            >
              Upvote on Product Hunt
            </a>
          </div>
          <button 
            onClick={handleHowItWorks}
            className="flex items-center justify-center space-x-1 mx-auto text-app-text-secondary hover:text-app-text-primary transition-colors duration-200"
          >
            <HelpCircle className="h-4 w-4" />
            <span>How it works</span>
          </button>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-app max-w-md w-full p-6 shadow-app relative animate-scale-in">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-semibold mb-6 text-app-text-primary">
              How Linkshare.live Works
            </h2>
            
            <div className="space-y-4 text-left">
              <div>
                <h3 className="font-medium mb-2 text-app-text-primary">Sharing Content</h3>
                <ul className="list-disc list-inside text-app-text-secondary space-y-2">
                  <li>Drop any link or message up to 400 characters</li>
                  <li>Get a unique 4-digit code that expires in 10 minutes</li>
                  <li>Share the code or QR code with others</li>
                  <li>Maximum of 5 active drops at a time</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-app-text-primary">Receiving Content</h3>
                <ul className="list-disc list-inside text-app-text-secondary space-y-2">
                  <li>Enter the 4-digit code to access shared content</li>
                  <li>Content automatically expires after 10 minutes</li>
                  <li>Option to copy or open links directly</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-app-text-primary">Privacy & Security</h3>
                <ul className="list-disc list-inside text-app-text-secondary space-y-2">
                  <li>All content is temporary and auto-deletes</li>
                  <li>No account or sign-up required</li>
                  <li>Content is only accessible with the correct code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}