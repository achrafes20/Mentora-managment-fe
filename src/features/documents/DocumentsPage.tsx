import { useState } from 'react'
import { PageHeader } from '@/components/ui/StatCard'
import {
  useExecuterSurveillance,
  useSurveillance,
  useRenvoyerDocumentSurveillance,
  useEnvoyerDocumentLibre,
} from './useDocuments'
import { useEmployes } from '../employee/useEmployes'
import dayjs from 'dayjs'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { FileText, Paperclip, RotateCcw, Send, X } from 'lucide-react'
import type { ApiError } from '@/lib/apiClient'

const FENETRE_RESTREINTE = 10
const FENETRE_ELARGIE = 30

// Corps par défaut proposé à l'Admin — miroir du repli backend (DocumentRhService), simple point de
// départ éditable avant envoi (même principe que RejectDialog en recrutement, EF-REC-14).
const CORPS_DOCUMENT_LIBRE_DEFAUT =
  'Bonjour,\n\nVeuillez trouver un document RH en pièce jointe.\n\nCordialement, RH'

function nomEmploye(e: { nom?: string; prenom?: string; email?: string }) {
  return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || e.email || 'Employé'
}

function EnvoyerDocumentLibreModal({
  open,
  onOpenChange,
  employes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employes: { id?: string; nom?: string; prenom?: string; email?: string }[]
}) {
  const [employeId, setEmployeId] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [corps, setCorps] = useState(CORPS_DOCUMENT_LIBRE_DEFAUT)
  const envoyerMutation = useEnvoyerDocumentLibre()

  // Réinitialise à l'ouverture — ajustement pendant le rendu plutôt qu'un effet (même pattern que
  // RejectDialog), pour éviter un rendu en cascade.
  const [ouvertPrecedemment, setOuvertPrecedemment] = useState(open)
  if (open !== ouvertPrecedemment) {
    setOuvertPrecedemment(open)
    if (open) {
      setEmployeId('')
      setFichier(null)
      setCorps(CORPS_DOCUMENT_LIBRE_DEFAUT)
    }
  }

  function fermer() {
    onOpenChange(false)
  }

  async function envoyer() {
    if (!employeId || !fichier) return
    try {
      await envoyerMutation.mutateAsync({ employeId, fichier, corpsMessage: corps })
      toast.success('Document envoyé avec succès')
      fermer()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message ?? "Échec de l'envoi du document")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(o) : fermer())}
      title="Envoyer un document libre"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          <Button
            onClick={envoyer}
            loading={envoyerMutation.isPending}
            disabled={!employeId || !fichier}
          >
            <Send size={14} />
            Envoyer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-[12px] font-medium text-[#1B2A41]">Employé</span>
          <div className="mt-1.5">
            <Select
              value={employeId}
              onChange={setEmployeId}
              options={employes
                .filter((e) => e.id)
                .map((e) => ({ value: e.id as string, label: nomEmploye(e) }))}
              placeholder="Sélectionner un employé"
            />
          </div>
        </label>

        <div>
          <span className="text-[12px] font-medium text-[#1B2A41]">
            Fichier (attestation de travail, autorisation spéciale, etc.)
          </span>
          {fichier ? (
            <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2">
              <span className="flex items-center gap-2 truncate text-[12px] text-[#1B2A41]">
                <Paperclip size={14} className="shrink-0 text-[#6B7280]" />
                <span className="truncate">{fichier.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setFichier(null)}
                className="shrink-0 text-[#9CA3AF] hover:text-[#C1495A]"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#D8D4CC] bg-white px-3 py-2.5 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
              <FileText size={14} />
              Choisir un fichier (PDF, JPEG ou PNG)
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}
        </div>

        <label className="block">
          <span className="text-[12px] font-medium text-[#1B2A41]">Message envoyé à l'employé</span>
          <p className="mt-0.5 mb-1.5 text-[11px] text-[#9CA3AF]">
            Pré-rempli — éditable avant envoi.
          </p>
          <textarea
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          />
        </label>
      </div>
    </Dialog>
  )
}

export function DocumentsPage() {
  const [page, setPage] = useState(0)
  const [jours, setJours] = useState(FENETRE_RESTREINTE)
  const [showEnvoyerModal, setShowEnvoyerModal] = useState(false)
  const { data: surveillance } = useSurveillance(page, 10, jours)
  const { data: employesData } = useEmployes({})
  const renvoyerMutation = useRenvoyerDocumentSurveillance()
  const executerSurveillanceMutation = useExecuterSurveillance()

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
      <PageHeader
        title="Documents RH"
        subtitle="Certificats et envois de documents"
        actions={
          <Button onClick={() => setShowEnvoyerModal(true)}>
            <Send size={14} />
            Envoyer un document
          </Button>
        }
      />

      <EnvoyerDocumentLibreModal
        open={showEnvoyerModal}
        onOpenChange={setShowEnvoyerModal}
        employes={employes}
      />

      <div className="rounded-xl border border-[#D8D4CC] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-[#1B2A41]">
              Documents de fin de contrat à surveiller
            </h2>
            <div className="flex items-center rounded-md border border-[#D8D4CC] p-0.5 text-[11px]">
              {[FENETRE_RESTREINTE, FENETRE_ELARGIE].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setPage(0)
                    setJours(f)
                  }}
                  className={`rounded px-2 py-0.5 ${
                    jours === f ? 'bg-[#1B2A41] text-white' : 'text-[#6B7280] hover:text-[#1B2A41]'
                  }`}
                >
                  {f}j
                </button>
              ))}
            </div>
          </div>
          <Button
            loading={executerSurveillanceMutation.isPending}
            onClick={async () => {
              try {
                await executerSurveillanceMutation.mutateAsync()
                toast.success('File de surveillance exécutée avec succès')
              } catch (error) {
                const apiError = error as ApiError
                toast.error(apiError.message ?? "Erreur lors de l'exécution du cron")
              }
            }}
          >
            Forcer la surveillance
          </Button>
        </div>

        <div className="space-y-3">
          {docsATraiter.length === 0 && (
            <p className="text-[13px] text-[#6B7280]">Aucun document en attente.</p>
          )}
          {docsATraiter.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-4"
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
                <Button
                  variant="secondary"
                  loading={renvoyerMutation.isPending}
                  onClick={async () => {
                    try {
                      await renvoyerMutation.mutateAsync(d.id)
                      toast.success('Document renvoyé avec succès')
                    } catch (error) {
                      const apiError = error as ApiError
                      toast.error(apiError.message ?? 'Erreur lors du renvoi')
                    }
                  }}
                >
                  <RotateCcw size={14} />
                  Renvoyer
                </Button>
                <a
                  href={`/employes/${d.employeId}?tab=documents`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#243650]"
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
    </div>
  )
}
