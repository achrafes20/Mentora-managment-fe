import { PageHeader } from '@/components/ui/StatCard'
import {
  useExecuterSurveillance,
  useSurveillance,
  useRenvoyerDocumentSurveillance,
} from './useDocuments'
import { useEmployes } from '../employee/useEmployes'
import dayjs from 'dayjs'
import { toast } from '@/components/ui/toast'
import type { ApiError } from '@/lib/apiClient'

export function DocumentsPage() {
  const { data: surveillance } = useSurveillance()
  const { data: employesData } = useEmployes({})
  const renvoyerMutation = useRenvoyerDocumentSurveillance()
  const executerSurveillanceMutation = useExecuterSurveillance()

  const pendingNotifs = surveillance ?? []
  const employes = employesData?.content ?? []

  const docsATraiter = pendingNotifs.map((notif) => {
    const employe = employes.find((e) => e.id === notif.employeId)
    let delai = ''
    if (notif.dateEcheance) {
      const diff = dayjs(notif.dateEcheance).diff(dayjs(), 'day')
      delai = diff > 0 ? `J-${diff}` : diff === 0 ? "Aujourd'hui" : `En retard (${diff}j)`
    }
    return {
      id: notif.id,
      employeId: notif.employeId,
      nom: employe ? `${employe.prenom} ${employe.nom}` : 'Inconnu',
      type:
        notif.typeFinSurveillee === 'fin_stage' ? 'Certificat de stage' : 'Certificat de travail',
      delai,
      poste: employe?.poste ?? '—',
      isStage: notif.typeFinSurveillee === 'fin_stage',
    }
  })

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Documents RH" subtitle="Certificats et envois de documents" />

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#1B2A41]">
          Documents de fin de contrat à surveiller
        </h2>
        <button
          onClick={async () => {
            try {
              await executerSurveillanceMutation.mutateAsync()
              toast.success('File de surveillance exécutée avec succès')
            } catch (error) {
              const apiError = error as ApiError
              toast.error(apiError.message ?? "Erreur lors de l'exécution du cron")
            }
          }}
          disabled={executerSurveillanceMutation.isPending}
          className="rounded-lg bg-[#C87F3A] px-3 py-1.5 text-[12px] text-white hover:bg-[#a66a31] disabled:opacity-50"
        >
          Forcer exécution Cron
        </button>
      </div>

      <div className="mb-8 space-y-3">
        {docsATraiter.length === 0 && (
          <p className="text-[13px] text-[#6B7280]">Aucun document en attente.</p>
        )}
        {docsATraiter.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-[#D8D4CC] bg-white p-4"
          >
            <div>
              <p className="text-[14px] font-medium text-[#1B2A41]">{d.nom}</p>
              <p className="text-[12px] text-[#6B7280]">
                {d.poste} — {d.type}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  d.delai.includes('J-3') || d.delai.includes('retard')
                    ? 'bg-[#C1495A]/10 text-[#C1495A]'
                    : 'bg-[#C87F3A]/10 text-[#C87F3A]'
                }`}
              >
                {d.delai}
              </span>
              <button
                disabled={renvoyerMutation.isPending}
                onClick={async () => {
                  try {
                    await renvoyerMutation.mutateAsync(d.id)
                    toast.success('Document renvoyé avec succès')
                  } catch (error) {
                    const apiError = error as ApiError
                    toast.error(apiError.message ?? 'Erreur lors du renvoi')
                  }
                }}
                className="rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[12px] text-[#1B2A41] hover:bg-[#F7F7F4] disabled:opacity-50"
              >
                {renvoyerMutation.isPending ? 'Envoi...' : 'Renvoyer'}
              </button>
              <a
                href={`/employes/${d.employeId}?tab=documents`}
                className="rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[12px] text-white hover:bg-[#243650]"
              >
                Traiter le dossier
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
