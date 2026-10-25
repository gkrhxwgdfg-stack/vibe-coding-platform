import { cn } from '@/lib/utils'
import { COPY } from '@/lib/copy'

export function Spinner({ className, label = COPY.loading.carnet }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-10 text-encre-soft', className)} role="status">
      <span className="w-5 h-5 rounded-full border-2 border-terra border-t-transparent animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
