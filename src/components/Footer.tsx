import React, { useState } from 'react'
import { Heart, HelpCircle } from 'lucide-react'
import { Modal, ModalClose } from './Modal'

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
      <footer className="footer-chrome">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-3">
            <div className="flex items-center gap-1 text-caption">
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
            <div className="hidden sm:block h-3 w-px bg-app-border-strong" />
            <a
              href="https://www.producthunt.com/products/linkshare-live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-app-blue hover:underline"
            >
              Upvote on Product Hunt
            </a>
          </div>
          <button
            onPointerDown={handleHowItWorks}
            className="btn-ghost mx-auto"
          >
            <HelpCircle className="h-4 w-4" />
            <span>How it works</span>
          </button>
        </div>
      </footer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        ariaLabelledBy="how-it-works-title"
      >
        <ModalClose onClose={() => setShowModal(false)} />

        <h2 id="how-it-works-title" className="text-heading mb-6 pr-8">
          How Linkshare.live Works
        </h2>

        <div className="space-y-6 text-left">
          <section>
            <h3 className="text-subheading text-sm mb-2">Sharing Content</h3>
            <ul className="text-caption space-y-2 pl-4 list-disc marker:text-app-text-tertiary">
              <li>Drop any link or message up to 400 characters</li>
              <li>Get a unique 4-digit code that expires in 10 minutes</li>
              <li>Share the code or QR code with others</li>
              <li>Maximum of 5 active drops at a time</li>
            </ul>
          </section>

          <section>
            <h3 className="text-subheading text-sm mb-2">Receiving Content</h3>
            <ul className="text-caption space-y-2 pl-4 list-disc marker:text-app-text-tertiary">
              <li>Enter the 4-digit code to access shared content</li>
              <li>Content automatically expires after 10 minutes</li>
              <li>Copy or open links directly from the result</li>
            </ul>
          </section>

          <section>
            <h3 className="text-subheading text-sm mb-2">Privacy & Security</h3>
            <ul className="text-caption space-y-2 pl-4 list-disc marker:text-app-text-tertiary">
              <li>All content is temporary and auto-deletes</li>
              <li>No account or sign-up required</li>
              <li>Content is only accessible with the correct code</li>
            </ul>
          </section>
        </div>
      </Modal>
    </>
  )
}
