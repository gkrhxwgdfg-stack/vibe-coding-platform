import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-11 h-11 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-20 h-20 text-3xl',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden',
        'bg-bleu-dark text-creme font-serif font-bold border-2 border-creme shadow-card',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
