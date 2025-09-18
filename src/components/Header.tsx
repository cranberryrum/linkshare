import React from 'react'
import { Link } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex justify-center">
        <div className="flex items-center space-x-2">
          <Link className="h-6 w-6 text-app-blue" />
          <h1 className="text-xl font-bold text-app-text-primary">
            Linkshare.live
          </h1>
        </div>
      </div>
    </header>
  )
}