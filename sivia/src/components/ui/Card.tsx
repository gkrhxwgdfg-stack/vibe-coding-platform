import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Surface crème arrondie — le « papier » de la maison */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-surface p-5', className)} {...props}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  kicker?: string
  title: ReactNode
  action?: ReactNode
}

export function CardHeader({ kicker, title, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        {kicker && <div className="kicker mb-1">{kicker}</div>}
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  )
}
