/** Formate une date ISO en « 8 février 2026 » (fr-FR) */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** « Il y a 3 jours », « le 12 mars » — pour la ligne « transmise depuis quand » */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days < 1) return "aujourd'hui"
  if (days < 2) return 'hier'
  if (days < 31) return `il y a ${days} jours`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `il y a ${months} mois`
  }
  const years = Math.floor(days / 365)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

/** Formate une durée en minutes : 90 -> « 1 h 30 » */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m}`
}

/** Initiales pour l'avatar : « Jeanne Dupont » -> « JD » */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
