import React from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyIconProps {
  copied: boolean
  className: string
}

// Copy and Check stacked in one box, cross-faded so feedback lands on the button itself
export const CopyIcon: React.FC<CopyIconProps> = ({ copied, className }) => (
  <span className={`relative inline-block ${className}`}>
    <Copy className={`swap-icon absolute inset-0 ${className}`} data-visible={!copied} />
    <Check className={`swap-icon absolute inset-0 text-green-600 ${className}`} data-visible={copied} />
  </span>
)
