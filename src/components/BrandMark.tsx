import React from 'react'

// The mark: a 2x2 grid of rounded squares — one for each digit of the code.
// Diagonal pairs alternate in strength so it reads as a pattern, not a block.
export const BrandMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => {
  const cell = (size - 2) / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden
    >
      <rect x={0} y={0} width={cell} height={cell} rx={cell * 0.32} fill="currentColor" />
      <rect x={cell + 2} y={0} width={cell} height={cell} rx={cell * 0.32} fill="currentColor" opacity={0.55} />
      <rect x={0} y={cell + 2} width={cell} height={cell} rx={cell * 0.32} fill="currentColor" opacity={0.55} />
      <rect x={cell + 2} y={cell + 2} width={cell} height={cell} rx={cell * 0.32} fill="currentColor" />
    </svg>
  )
}
