import { Clock, KeyRound, XCircle } from 'lucide-react'
import { useState } from 'react'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'
import { formatDecompte, useCompteARebours } from '@/components/ui/useCompteARebours'
import type { ApiError } from '@/lib/apiClient'
import { verifierCodeActivation } from './api'

interface Props {
  onActive: () => void
  onJeton: (jeton: string) => void
  titre?: string
  sousTitre?: string
  libelleBouton?: string
}

/**
 * EF-ATT-17 : prompt d'activation affiché tant que le téléphone de l'employé n'a pas de jeton
 * valide — appairage de l'appareil personnel (cf. MobilePointagePage).
 */
export function KiosqueActivationPrompt({
  onActive,
  onJeton,
  titre = 'Activation',
  sousTitre = 'Saisissez le code fourni par votre administrateur',
  libelleBouton = 'Activer',
}: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Épinglé au chargement de la réponse d'erreur (data.verrouilleJusquA, en ISO) — le décompte
  // affiché est dérivé de cette valeur fixe et de l'horloge locale, jamais re-demandé au serveur.
  const [verrouilleJusquA, setVerrouilleJusquA] = useState<number | null>(null)
  const { secondesRestantes, enCours: encoreVerrouille } = useCompteARebours(verrouilleJusquA)

  async function soumettre() {
    if (!code.trim() || encoreVerrouille) return
    setLoading(true)
    setErreur(null)
    try {
      const jeton = await verifierCodeActivation(code.trim())
      onJeton(jeton)
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
            {titre}
          </h1>
          <p className="mt-1 text-[12px] text-white/60">{sousTitre}</p>
        </div>

        <div className="space-y-4 p-8">
          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <KeyRound size={13} />
            Code d'activation (4 chiffres)
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              setErreur(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void soumettre()
            }}
            maxLength={4}
            placeholder="1234"
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
            {loading ? '…' : libelleBouton}
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
