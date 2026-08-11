import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'
import { revoquerParJeton } from './api'

type Etat = 'attente' | 'en_cours' | 'succes' | 'erreur'

/**
 * EF-ATT-19 : page publique ouverte depuis le lien de révocation reçu par e-mail — révoque
 * l'appareil personnel perdu/volé sans authentification (le jeton dans l'URL est la preuve
 * d'intention). Étape de confirmation manuelle (bouton) plutôt qu'automatique à l'ouverture :
 * évite qu'un scanner d'e-mail ou un aperçu de lien ne déclenche la révocation par accident.
 */
export function RevoquerAppareilPage() {
  const [searchParams] = useSearchParams()
  const jeton = searchParams.get('jeton')
  const [etat, setEtat] = useState<Etat>('attente')
  const [erreur, setErreur] = useState<string | null>(null)

  async function confirmer() {
    if (!jeton) return
    setEtat('en_cours')
    setErreur(null)
    try {
      await revoquerParJeton(jeton)
      setEtat('succes')
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      setErreur(apiErr?.message ?? 'Erreur inconnue')
      setEtat('erreur')
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
            Révoquer ce téléphone
          </h1>
          <p className="mt-1 text-[12px] text-white/60">
            Téléphone perdu ou volé — coupez son accès au pointage
          </p>
        </div>

        <div className="space-y-5 p-8">
          {!jeton && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/8 px-4 py-5 text-center">
              <XCircle size={28} className="text-[#C1495A]" />
              <p className="text-[14px] font-medium text-[#1B2A41]">Lien invalide</p>
              <p className="text-[12px] text-[#6B7280]">
                Ce lien de révocation est incomplet. Utilisez celui reçu par e-mail.
              </p>
            </div>
          )}

          {jeton && etat === 'attente' && (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-[#C87F3A]/30 bg-[#C87F3A]/10 px-3 py-2.5 text-[12px] text-[#C87F3A]">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                Cette action est immédiate et ne peut pas être annulée. Vous devrez recontacter les
                RH pour recevoir un nouveau code.
              </div>
              <button
                onClick={() => void confirmer()}
                className="w-full rounded-lg bg-[#C1495A] py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#a83d4b]"
              >
                Confirmer la révocation
              </button>
            </>
          )}

          {etat === 'en_cours' && (
            <p className="text-center text-[13px] text-[#6B7280]">Révocation en cours…</p>
          )}

          {etat === 'succes' && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/8 px-4 py-5 text-center">
              <CheckCircle2 size={28} className="text-[#4A7C6B]" />
              <p className="text-[14px] font-medium text-[#1B2A41]">Appareil révoqué</p>
              <p className="text-[12px] text-[#6B7280]">
                Cet accès a été coupé. Contactez les RH pour recevoir un nouveau code.
              </p>
            </div>
          )}

          {etat === 'erreur' && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/8 px-4 py-5 text-center">
              <XCircle size={28} className="text-[#C1495A]" />
              <p className="text-[14px] font-medium text-[#1B2A41]">Erreur</p>
              <p className="text-[12px] text-[#6B7280]">{erreur}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
