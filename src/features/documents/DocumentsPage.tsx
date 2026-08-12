import { useState } from 'react'
import { PageHeader } from '@/components/ui/StatCard'
import {
  useExecuterSurveillance,
  useSurveillance,
  useRenvoyerDocumentSurveillance,
} from './useDocuments'
import { useEmployes, useExecuterDesactivationAutomatique } from '../employee/useEmployes'
import dayjs from 'dayjs'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import type { ApiError } from '@/lib/apiClient'

const FENETRE_RESTREINTE = 10
const FENETRE_ELARGIE = 30

export function DocumentsPage() {
  const [page, setPage] = useState(0)
  const [jours, setJours] = useState(FENETRE_RESTREINTE)
  const { data: surveillance } = useSurveillance(page, 10, jours)
  const { data: employesData } = useEmployes({})
  const renvoyerMutation = useRenvoyerDocumentSurveillance()
  const executerSurveillanceMutation = useExecuterSurveillance()
  const executerDesactivationMutation = useExecuterDesactivationAutomatique()

  const pendingNotifs = surveillance?.content ?? []
  const employes = employesData?.content ?? []

  // id/employeId sont optionnels dans le type généré (springdoc ne les marque jamais requis) mais
  // une ligne sans les deux n'est de toute façon pas exploitable ici (ni renvoi ni lien possible) —
  // flatMap plutôt que map pour les exclure proprement au lieu de propager `undefined`.
  const docsATraiter = pendingNotifs.flatMap((notif) => {
    if (!notif.id || !notif.employeId) return []
    const employe = employes.find((e) => e.id === notif.employeId)
    let delai = ''
    if (notif.dateEcheance) {
      const diff = dayjs(notif.dateEcheance).startOf('day').diff(dayjs().startOf('day'), 'day')
      delai = diff > 0 ? `J-${diff}` : diff === 0 ? "Aujourd'hui" : `En retard (${diff}j)`
    }
    return [
      {
        id: notif.id,
        employeId: notif.employeId,
        nom: employe ? `${employe.prenom} ${employe.nom}` : 'Inconnu',
        type:
          notif.typeFinSurveillee === 'fin_stage' ? 'Certificat de stage' : 'Certificat de travail',
        delai,
        poste: employe?.poste ?? '—',
        isStage: notif.typeFinSurveillee === 'fin_stage',
      },
    ]
  })

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Documents RH" subtitle="Certificats et envois de documents" />

      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-semibold text-[#1B2A41]">
            Documents de fin de contrat à surveiller
          </h2>
          <button
            onClick={() => {
              setPage(0)
              setJours(jours === FENETRE_RESTREINTE ? FENETRE_ELARGIE : FENETRE_RESTREINTE)
            }}
            className="text-[11px] text-[#6B7280] underline hover:text-[#1B2A41]"
          >
            {jours === FENETRE_RESTREINTE
              ? `Voir sur ${FENETRE_ELARGIE} jours`
              : `Revenir à ${FENETRE_RESTREINTE} jours`}
          </button>
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={async () => {
              try {
                await executerDesactivationMutation.mutateAsync()
                toast.success('Désactivation automatique exécutée avec succès')
              } catch (error) {
                const apiError = error as ApiError
                toast.error(apiError.message ?? "Erreur lors de l'exécution")
              }
            }}
            disabled={executerDesactivationMutation.isPending}
            className="rounded-lg border border-[#C87F3A] px-3 py-1.5 text-[12px] text-[#C87F3A] hover:bg-[#C87F3A]/8 disabled:opacity-50"
          >
            Forcer désactivation auto.
          </button>
        </div>
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
        {surveillance && surveillance.totalElements! > 0 && (
          <div className="flex items-center justify-between border-t border-[#D8D4CC] pt-3">
            <span className="text-[12px] text-[#6B7280]">
              Page {surveillance.page! + 1} sur {Math.max(surveillance.totalPages!, 1)} (
              {surveillance.totalElements} entrées)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="secondary"
                disabled={surveillance.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
