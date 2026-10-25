import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { reconcileTimer, type TimerState } from '@/lib/cookingSession'
import { usePrefersReducedMotion } from '@/lib/motion'

interface CookingTimerV2Props {
  timer: TimerState
  onChange: (next: TimerState) => void
}

/** 755 s -> « 12:35 » */
function formatCountdown(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

const RADIUS = 86
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Deux bips doux générés (WebAudio) — aucun asset, muet par défaut */
function playBell() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime
    for (const offset of [0, 0.18]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.4)
    }
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    // pas de son : la vibration + le visuel suffisent
  }
}

/**
 * Minuteur libellé du mode cuisson v2 : cercle couture progressif, pré-alerte
 * 1 min avant la fin (halo pulsant), fin carmine + `navigator.vibrate`, son
 * optionnel muet par défaut.
 */
export function CookingTimerV2({ timer, onChange }: CookingTimerV2Props) {
  const reducedMotion = usePrefersReducedMotion()
  const [remaining, setRemaining] = useState(() => reconcileTimer(timer))
  const [muted, setMuted] = useState(true)

  const running = timer.endsAt !== null
  const done = remaining <= 0
  // Pré-alerte : entre 60 s et 0 s restantes, halo pulsant
  const prealert = !done && remaining <= 60

  // Dénombrement à la seconde, avec reconciliation d'horloge à chaque tick
  useEffect(() => {
    if (!running || done) return
    const tick = setInterval(() => {
      setRemaining(reconcileTimer(timer))
    }, 1000)
    return () => clearInterval(tick)
  }, [running, done, timer])

  // Fin : vibration + son (si dé-muet) — une seule fois
  const announcedRef = useRef(false)
  useEffect(() => {
    if (!done || announcedRef.current) return
    announcedRef.current = true
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    if (!muted) playBell()
  }, [done, muted])

  // Durée totale affichée : le temps figé en pause, sinon le temps initial
  // (recalculé à la reprise depuis endsAt)
  const initialTotal = timer.remainingWhenPaused ?? Math.max(remaining, 1)
  const elapsedFraction = initialTotal > 0 ? (initialTotal - remaining) / initialTotal : 0
  const progressDash = Math.min(CIRCUMFERENCE, elapsedFraction * CIRCUMFERENCE).toFixed(1) + ' ' + CIRCUMFERENCE.toFixed(1)

  function toggleRun() {
    if (running) {
      // Pause : fige le temps restant
      onChange({ ...timer, endsAt: null, remainingWhenPaused: remaining })
    } else {
      // Reprise : nouveau timestamp de fin
      onChange({ ...timer, endsAt: Date.now() + remaining * 1000, remainingWhenPaused: null })
    }
  }

  function reset() {
    onChange({ ...timer, endsAt: null, remainingWhenPaused: initialTotal })
    setRemaining(initialTotal)
    announcedRef.current = false
  }

  return (
    <div className={cn('rounded-2xl card-surface card-pad p-4', prealert && !reducedMotion && 'timer-prealert')}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-serif font-semibold text-lg">{timer.label}</p>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Activer le son à la fin du minuteur' : 'Couper le son du minuteur'}
          aria-pressed={!muted}
          className="touch-target-lg min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra-dark inline-flex items-center justify-center"
        >
          {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
        </button>
      </div>

      <div
        className="relative mx-auto w-48 h-48 select-none"
        role="timer"
        aria-live={done ? 'assertive' : 'off'}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={RADIUS} className="fill-creme" />
          {/* Contour pointillé (temps total) */}
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
              className={done ? 'stroke-carmine' : 'stroke-terra'}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <p className="text-hand text-3xl text-carmine">C'est prêt&nbsp;!</p>
          ) : (
            <p className="font-serif text-5xl font-bold text-encre tabular-nums">
              {formatCountdown(remaining)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button variant={running ? 'outline' : 'primary'} onClick={toggleRun} disabled={done} aria-pressed={running}>
          {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {running ? 'Pause' : remaining === initialTotal ? 'Démarrer' : 'Reprendre'}
        </Button>
        <Button variant="ghost" onClick={reset} aria-label={`Remettre le minuteur « ${timer.label} » à zéro`}>
          <RotateCcw size={18} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
