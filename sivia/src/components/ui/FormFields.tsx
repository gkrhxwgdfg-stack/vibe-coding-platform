import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
}

function FieldShell({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="block font-bold text-[15px] text-encre mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-encre-doux mt-1.5">{hint}</p>}
      {error && (
        <p className="text-[15px] text-tomate font-bold mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Champs 18 px minimum, focus : bordure verte + ring vert-clair (§6.2)
const inputClasses =
  'w-full min-h-12 rounded-[14px] border-[1.5px] border-encre-doux/28 bg-carte px-3.5 py-3 text-lg text-encre placeholder:text-encre-doux/60 focus:border-vert focus:ring-3 focus:ring-vert-clair focus:outline-none'

export function TextInput({
  label,
  htmlFor,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; htmlFor: string; hint?: string; error?: string }) {
  return (
    <FieldShell label={label} htmlFor={htmlFor} hint={hint} error={error}>
      <input id={htmlFor} className={cn(inputClasses, className)} {...props} />
    </FieldShell>
  )
}

export function TextArea({
  label,
  htmlFor,
  hint,
  error,
  className,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; htmlFor: string; hint?: string; error?: string }) {
  return (
    <FieldShell label={label} htmlFor={htmlFor} hint={hint} error={error}>
      <textarea id={htmlFor} rows={rows} className={cn(inputClasses, className)} {...props} />
    </FieldShell>
  )
}

export function Select({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; htmlFor: string; hint?: string; error?: string }) {
  return (
    <FieldShell label={label} htmlFor={htmlFor} hint={hint} error={error}>
      <select id={htmlFor} className={cn(inputClasses, className)} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}
