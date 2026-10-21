import { useEffect, useState } from 'react'
import { Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Minuteur du mode cuisson — adapté de l'horloge de la DA :
 * cercle au contour pointillé terracotta, fond crème, pas de chiffres sur
 * le cadran, deux aiguilles (une grande encre, une petite carmine) qui
 * tournent pendant le décompte. Alerte **visuelle uniquement** : à la fin,
 * le contour devient carmine et pulse (pas de son, ça réveillerait la maison).
 */

/** 755 s -> "12:35" (format mm:ss) */
function formatCountdown(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

const RADIUS = 86
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CookingTimer({ initialMinutes }: { initialMinutes: number }) {
  const initialSeconds = Math.round(initialMinutes * 60)
  const [total, setTotal] = useState(initialSeconds)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)

  // Décompte : une seconde à la fois, proprement nettoyé
  useEffect(() => {
    if (!running || remaining <= 0) return
    const tick = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [running, remaining <= 0])

  // Fin du décompte : on arrête le minuteur
  useEffect(() => {
    if (remaining === 0) setRunning(false)
  }, [remaining])

  const done = total > 0 && remaining === 0
  const elapsedFraction = total > 0 ? (total - remaining) / total : 0

  // Aiguilles façon horloge : la grande fait le tour complet du cadran,
  // la petite avance comme une aiguille des heures (1/12e de tour)
  const bigHandAngle = elapsedFraction * 360
  const smallHandAngle = elapsedFraction * 30

  function addFiveMinutes() {
    setTotal((t) => t + 300)
    setRemaining((r) => r + 300)
  }

  function reset() {
    setTotal(initialSeconds)
    setRemaining(initialSeconds)
    setRunning(false)
  }

  const contourColor = done ? 'stroke-carmine' : 'stroke-terra'
  const progressLength = Math.min(CIRCUMFERENCE, elapsedFraction * CIRCUMFERENCE)
  const progressDash = progressLength.toFixed(1) + ' ' + CIRCUMFERENCE.toFixed(1)

  return (
    <div className={done ? 'animate-pulse' : undefined}>
      {/* Cadran */}
      <div
        className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 select-none"
        role="timer"
        aria-live={done ? 'assertive' : 'off'}
      >
        {/* Anneaux (pivotés pour démarrer à midi) */}
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Fond crème */}
          <circle cx="100" cy="100" r={RADIUS} className="fill-creme" />
          {/* Contour pointillé (temps restant) */}
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray="0.5 8"
            className={done ? 'stroke-carmine/40' : 'stroke-terra/40'}
          />
          {/* Progression : les pointillés se remplissent en terracotta plein */}
          {elapsedFraction > 0 && (
            <circle
              cx="100" cy="100" r={RADIUS}
              fill="none" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={progressDash}
              className={contourColor}
            />
          )}
        </svg>
        {/* Aiguilles (dessinées à part, non pivotées avec le cadran) */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
          {/* Grande aiguille : encre */}
          <line
            x1="100" y1="110" x2="100" y2="32"
            strokeWidth="5" strokeLinecap="round" className="stroke-encre"
            transform={'rotate(' + bigHandAngle + ' 100 100)'}
          />
          {/* Petite aiguille : carmine */}
          <line
            x1="100" y1="110" x2="100" y2="52"
            strokeWidth="7" strokeLinecap="round" className="stroke-carmine"
            transform={'rotate(' + smallHandAngle + ' 100 100)'}
          />
          {/* Pivot */}
          <circle cx="100" cy="100" r="6" className="fill-encre" />
        </svg>
        {/* Temps restant, au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <p className="text-hand text-4xl text-carmine">C'est prêt&nbsp;!</p>
          ) : (
            <p className="font-serif text-6xl font-bold text-encre tabular-nums">
              {formatCountdown(remaining)}
            </p>
          )}
        </div>
      </div>

      {/* Commandes : grosses cibles (>= 44px), pas de son */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          variant={running ? 'outline' : 'primary'}
          onClick={() => setRunning((value) => !value)}
          disabled={done}
          aria-pressed={running}
        >
          {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {running ? 'Pause' : remaining === total ? 'Démarrer' : 'Reprendre'}
        </Button>
        <Button variant="outline" onClick={addFiveMinutes} disabled={done}>
          <Plus size={18} aria-hidden="true" /> 5 min
        </Button>
        <Button variant="ghost" onClick={reset} aria-label="Remettre le minuteur à zéro">
          <RotateCcw size={18} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
