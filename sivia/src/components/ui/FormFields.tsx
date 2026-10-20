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
      <label htmlFor={htmlFor} className="block font-bold text-encre mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-encre-soft mt-1.5">{hint}</p>}
      {error && (
        <p className="text-sm text-carmine font-bold mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClasses =
  'w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 text-encre placeholder:text-encre-soft/60 focus:border-terra focus:outline-none'

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
