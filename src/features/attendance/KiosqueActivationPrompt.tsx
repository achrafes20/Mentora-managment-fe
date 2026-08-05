import { Clock, KeyRound, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'
import type { ApiError } from '@/lib/apiClient'
import { verifierCodeActivation } from './api'
import { enregistrerJetonAppareil } from './kiosqueDevice'

interface Props {
  onActive: () => void
}

function formatDecompte(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * NFR-UX-02 : prompt d'activation affiché tant que cet appareil n'a pas de jeton valide — même
 * carte visuelle que l'écran de scan (KiosquePage) pour rester cohérent sur un même appareil.
 */
export function KiosqueActivationPrompt({ onActive }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Épinglé au chargement de la réponse d'erreur (data.verrouilleJusquA, en ISO) — le décompte
  // affiché est dérivé de cette valeur fixe et de l'horloge locale, jamais re-demandé au serveur.
  const [verrouilleJusquA, setVerrouilleJusquA] = useState<number | null>(null)
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    if (verrouilleJusquA === null) return
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [verrouilleJusquA])

  const secondesRestantes =
    verrouilleJusquA !== null ? Math.max(0, Math.ceil((verrouilleJusquA - maintenant) / 1000)) : 0
  const encoreVerrouille = verrouilleJusquA !== null && secondesRestantes > 0

  async function soumettre() {
    if (!code.trim() || encoreVerrouille) return
    setLoading(true)
    setErreur(null)
    try {
      const jeton = await verifierCodeActivation(code.trim())
      enregistrerJetonAppareil(jeton)
      onActive()
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setErreur(apiErr?.message ?? 'Erreur inconnue')
      const donnee = apiErr?.data as { verrouilleJusquA?: string } | undefined
      setVerrouilleJusquA(
        donnee?.verrouilleJusquA ? new Date(donnee.verrouilleJusquA).getTime() : null,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4] p-6">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#D8D4CC] bg-white shadow-xl">
        <div className="border-b border-[#D8D4CC] bg-[#1B2A41] px-8 py-6 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#243650]"
            style={{ boxShadow: `0 0 0 1px ${ROSE_MARQUE}33` }}
          >
            <HBLogo size={32} />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[20px] font-semibold text-white"
          >
            Activation du kiosque
          </h1>
          <p className="mt-1 text-[12px] text-white/60">
            Saisissez le code fourni par votre administrateur
          </p>
        </div>

        <div className="space-y-4 p-8">
          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <KeyRound size={13} />
            Code d'activation (6 caractères)
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setErreur(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void soumettre()
            }}
            maxLength={6}
            placeholder="A1B2C3"
            autoFocus
            disabled={encoreVerrouille}
            style={{ fontFamily: 'var(--font-code)' }}
            className="w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-4 py-3 text-center text-[20px] tracking-[0.3em] text-[#1B2A41] placeholder:text-[#D8D4CC] focus:border-[#1B2A41] focus:outline-none disabled:opacity-50"
          />

          <button
            disabled={loading || !code.trim() || encoreVerrouille}
            onClick={() => void soumettre()}
            className="w-full rounded-lg bg-[#1B2A41] py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-50"
          >
            {loading ? '…' : 'Activer ce kiosque'}
          </button>

          {erreur && (
            <div className="flex items-center gap-2 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 px-4 py-3 text-[12px] text-[#C1495A]">
              <XCircle size={14} className="shrink-0" />
              {erreur}
            </div>
          )}

          {encoreVerrouille && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 px-4 py-3 text-[13px] font-medium text-[#C1495A]">
              <Clock size={14} className="shrink-0" />
              Réessayez dans{' '}
              <span style={{ fontFamily: 'var(--font-code)' }}>
                {formatDecompte(secondesRestantes)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
