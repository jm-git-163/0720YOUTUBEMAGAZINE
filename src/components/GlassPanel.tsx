import type { ReactNode } from 'react'

export function GlassPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`ai-glass rounded-lg border border-border-subtle ${className}`}
    >
      {children}
    </div>
  )
}
