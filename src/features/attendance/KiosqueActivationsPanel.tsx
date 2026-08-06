import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Ban } from 'lucide-react'
import { useState } from 'react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/Button'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import type { ApiError } from '@/lib/apiClient'
import {
  genererCodeActivationKiosque,
  listerActivationsKiosque,
  revoquerActivationKiosque,
} from './api'

const CLE_ACTIVATIONS_KIOSQUE = ['kiosque-activations'] as const

// NFR-UX-02 : le statut en base reste "en_attente" indéfiniment même après expiration (vérifiée
// seulement à la saisie côté backend, jamais réécrite en base) — dérivé ici à l'affichage plutôt
// que stocké, pour ne jamais diverger. Miroir du défaut backend (app.security.kiosque
// .expiration-code-heures) ; purement informatif, l'application réelle reste côté serveur.
const EXPIRATION_CODE_HEURES = 24

function estCodeExpire(a: { statut: string; emisLe: string }): boolean {
  return (
    a.statut === 'en_attente' &&
    dayjs(a.emisLe).add(EXPIRATION_CODE_HEURES, 'hour').isBefore(dayjs())
  )
}

/**
 * NFR-UX-02 : écran de gestion des activations kiosque — génération d'un code (affiché une seule
 * fois, jamais récupérable ensuite) et révocation. Réservé à l'Admin/délégué actif côté backend ;
 * le tab qui monte ce composant applique déjà la même garde (cf. PresencePage).
 */
export function KiosqueActivationsPanel() {
  const queryClient = useQueryClient()
  const [codeGenere, setCodeGenere] = useState<string | null>(null)

  const { data: activations, isLoading } = useQuery({
    queryKey: CLE_ACTIVATIONS_KIOSQUE,
    queryFn: listerActivationsKiosque,
  })

  const genererMutation = useMutation<{ id: string; code: string }, ApiError>({
    mutationFn: genererCodeActivationKiosque,
    onSuccess: (res) => {
      setCodeGenere(res.code)
      void queryClient.invalidateQueries({ queryKey: CLE_ACTIVATIONS_KIOSQUE })
    },
    onError: (err) => toast.error(err.message),
  })

  const revoquerMutation = useMutation<void, ApiError, string>({
    mutationFn: revoquerActivationKiosque,
    onSuccess: () => {
      toast.success('Activation révoquée.')
      void queryClient.invalidateQueries({ queryKey: CLE_ACTIVATIONS_KIOSQUE })
    },
    onError: (err) => toast.error(err.message),
  })

  function demanderRevocation(id: string) {
    confirm({
      title: 'Révoquer cette activation ?',
      content: "L'appareil concerné devra ressaisir un nouveau code pour scanner à nouveau.",
      okText: 'Révoquer',
      onOk: async () => {
        try {
          await revoquerMutation.mutateAsync(id)
        } catch {
          // déjà notifié par onError de la mutation
        }
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-[#1B2A41]">Activations kiosque</h3>
          <p className="text-[12px] text-[#6B7280]">
            Le code expire après 24h s'il n'est pas saisi ; une fois l'appareil activé, il reste
            valide jusqu'à révocation manuelle.
          </p>
        </div>
        <Button
          loading={genererMutation.isPending}
          onClick={() => {
            setCodeGenere(null)
            void genererMutation.mutateAsync()
          }}
        >
          <KeyRound size={13} /> Générer un code
        </Button>
      </div>

      {codeGenere && (
        <div className="rounded-xl border border-[#4A7C6B]/25 bg-[#4A7C6B]/8 p-5 text-center">
          <p className="text-[11px] font-medium tracking-wider text-[#4A7C6B] uppercase">
            Code d'activation — communiquez-le maintenant
          </p>
          <p
            style={{ fontFamily: 'var(--font-code)' }}
            className="mt-2 text-[28px] font-semibold tracking-[0.3em] text-[#1B2A41]"
          >
            {codeGenere}
          </p>
          <p className="mt-2 text-[11px] text-[#9CA3AF]">
            Ce code ne sera plus jamais affiché — saisissez-le sur l'appareil kiosque maintenant.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Généré le', 'Statut', 'Activée le', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Chargement…
                </td>
              </tr>
            ) : (
              (activations ?? []).map((a) => (
                <tr key={a.id} className="hover:bg-[#F7F7F4]">
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {dayjs(a.emisLe).format('DD/MM/YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={estCodeExpire(a) ? 'Expiré' : formatStatut(a.statut)} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {a.activeeLe ? dayjs(a.activeeLe).format('DD/MM/YYYY HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {a.statut !== 'revoquee' && (
                      <button
                        onClick={() => demanderRevocation(a.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#C1495A]/30 px-2.5 py-1 text-[11px] text-[#C1495A] hover:bg-[#C1495A]/8"
                      >
                        <Ban size={11} /> Révoquer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
            {!isLoading && (activations ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Aucune activation pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
