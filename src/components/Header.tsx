import React from 'react'
import { Link } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <header className="header-chrome">
      <div className="max-w-md mx-auto flex justify-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-app-button bg-app-blue-muted">
            <Link className="h-4 w-4 text-app-blue" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-app-text-primary tracking-tight">
            Linkshare.live
          </h1>
        </div>
      </div>
    </header>
  )
}
