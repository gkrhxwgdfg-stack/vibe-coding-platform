import { useState } from 'react'

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

/** Texte tronquable avec bouton « Voir la suite » / « Voir moins » */
export function ExpandableText({ text, maxLength = 120, className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>
  }
  return (
    <span className={className}>
      {expanded ? text : `${text.slice(0, maxLength).trimEnd()}…`}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setExpanded(!expanded)
        }}
        className="ml-1 font-bold text-terra-dark hover:underline whitespace-nowrap"
      >
        {expanded ? 'Voir moins' : 'Voir la suite'}
      </button>
    </span>
  )
}
