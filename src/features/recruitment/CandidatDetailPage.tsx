import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FileText } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/lib/AuthContext'
import { useEstDelegueActifMaintenant } from '@/features/delegation/useDelegation'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast'
import { formatStatut } from '@/components/ui/tokens'
import type { ApiError } from '@/lib/apiClient'
import { useDepartements } from '@/features/employee/useDepartements'
import { useManagers, libelleManager } from '@/features/employee/useManagers'
import {
  useCandidature,
  useChangerStatutCandidature,
  useEnregistrerResultatEntretien,
  useEntretiens,
  useOffre,
  useRelancerAnalyse,
  useReprogrammerEntretien,
  useValiderReactivation,
} from './useRecruitment'
import { voirCvCandidature, type ResultatEntretienRequete } from './recruitmentApi'
import { EntretienScheduleDialog } from './EntretienScheduleDialog'
import { RejectDialog } from './RejectDialog'

export function CandidatDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { role, user } = useAuth()
  const estDelegueActif = useEstDelegueActifMaintenant()
  // EF-AUTH-11/12 : un délégué actif hérite des droits de décision recrutement de l'Admin
  // (CandidatureController — miroir de estAdmin côté backend, jamais pour enregistrerResultatEntretien
  // qui reste Manager-only).
  const peutDecider = role === 'admin' || estDelegueActif
  const estManager = role === 'manager'

  const { data: candidature, isLoading } = useCandidature(id)
  const { data: offre } = useOffre(candidature?.offreId ?? undefined)
  const { data: departements } = useDepartements()
  const { data: managers } = useManagers()
  const { data: entretiens } = useEntretiens(id)

  const changerStatutMutation = useChangerStatutCandidature(id ?? '')
  const relancerMutation = useRelancerAnalyse(id ?? '')
  const reactivationMutation = useValiderReactivation(id ?? '')
  const entretienMutation = useEnregistrerResultatEntretien(id ?? '')
  const reprogrammerMutation = useReprogrammerEntretien(id ?? '')

  const [dialogRejet, setDialogRejet] = useState(false)
  const [dialogPlanification, setDialogPlanification] = useState<
    'creation' | 'reprogrammation' | null
  >(null)
  const [commentaireEntretien, setCommentaireEntretien] = useState('')

  if (isLoading) {
    return <p className="p-8 text-[13px] text-[#9CA3AF]">Chargement…</p>
  }
  if (!candidature) {
    return (
      <div className="p-8">
        <p className="text-[#C1495A]">Candidature introuvable</p>
      </div>
    )
  }

  const analyse = candidature.derniereAnalyse
  const analyseEnAttente = !analyse || analyse.statut !== 'succes'
  const score = analyse?.scoreCorrespondance ?? null
  const scoreColor = (score ?? 0) >= 80 ? '#4A7C6B' : (score ?? 0) >= 60 ? '#C87F3A' : '#C1495A'
  const dernierEntretien = entretiens?.[0]
  const managerAssigne = managers?.find((m) => m.id === dernierEntretien?.managerId)
  const managerResoluId = departements?.find((d) => d.id === offre?.departementId)?.managerId
  const entretienResolu = !!dernierEntretien?.resultat
  // EF-REC-09 : le résultat n'est saisissable que par le Manager précisément assigné à cet
  // entretien — pas "un manager quelconque" (bug repéré le 2026-07-23 : `estManager` seul
  // affichait les boutons à tout Manager, backend rejetait ensuite avec
  // EntretienManagerNonAssigneException).
  const estManagerAssigne = estManager && user?.id === dernierEntretien?.managerId

  function changerStatut(
    statut: string,
    managerId?: string,
    dateEntretien?: string,
    corpsMessage?: string,
  ) {
    changerStatutMutation
      .mutateAsync({ statut: statut as never, managerId, dateEntretien, corpsMessage })
      .then(() => {
        toast.success(`Statut mis à jour : ${formatStatut(statut)}.`)
        setDialogRejet(false)
        setDialogPlanification(null)
      })
      .catch((err: ApiError) => toast.error(err.message))
  }

  function reprogrammer(managerId?: string, dateEntretien?: string) {
    reprogrammerMutation
      .mutateAsync({ managerId, dateEntretien })
      .then(() => {
        toast.success('Entretien reprogrammé.')
        setDialogPlanification(null)
      })
      .catch((err: ApiError) => toast.error(err.message))
  }

  function soumettreEntretien(resultat: ResultatEntretienRequete['resultat']) {
    entretienMutation
      .mutateAsync({ resultat, commentaire: commentaireEntretien || undefined })
      .then(() => toast.success('Résultat enregistré — candidature passée en Décision.'))
      .catch((err: ApiError) => toast.error(err.message))
  }

  function relancerAnalyse() {
    relancerMutation
      .mutateAsync()
      .then(() => toast.success('Analyse relancée.'))
      .catch((err: ApiError) => toast.error(err.message))
  }

  function validerReactivation() {
    reactivationMutation
      .mutateAsync()
      .then(() => toast.success('Candidature réintégrée au pipeline.'))
      .catch((err: ApiError) => toast.error(err.message))
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <RejectDialog
        open={dialogRejet}
        onCancel={() => setDialogRejet(false)}
        onConfirm={(corps) => changerStatut('rejete', undefined, undefined, corps)}
        submitting={changerStatutMutation.isPending}
      />
      <EntretienScheduleDialog
        open={dialogPlanification !== null}
        title={
          dialogPlanification === 'creation' ? "Planifier l'entretien" : "Reprogrammer l'entretien"
        }
        managerParDefaut={
          dialogPlanification === 'reprogrammation'
            ? (dernierEntretien?.managerId ?? managerResoluId ?? null)
            : (managerResoluId ?? null)
        }
        dateParDefaut={
          dialogPlanification === 'reprogrammation' ? dernierEntretien?.dateEntretien : null
        }
        onCancel={() => setDialogPlanification(null)}
        onConfirm={(managerId, dateEntretien) =>
          dialogPlanification === 'creation'
            ? changerStatut('entretien', managerId, dateEntretien)
            : reprogrammer(managerId, dateEntretien)
        }
        submitting={changerStatutMutation.isPending || reprogrammerMutation.isPending}
      />

      <button
        onClick={() => navigate('/recrutement')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour au pipeline
      </button>
      <PageHeader
        title={
          candidature.prenom || candidature.nom
            ? `${candidature.prenom ?? ''} ${candidature.nom ?? ''}`.trim()
            : (candidature.email ?? '')
        }
        subtitle={candidature.intitulePosteDetecte ?? candidature.email ?? ''}
        actions={<StatusTag statut={formatStatut(candidature.statut ?? '')} />}
      />

      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            Score IA
          </p>
          <p
            style={{ fontFamily: 'var(--font-display)', color: scoreColor }}
            className="mt-2 text-[48px] leading-none font-semibold"
          >
            {score ?? '—'}
            {score !== null && '%'}
          </p>
          {relancerMutation.isPending ? (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Spinner size="small" /> Analyse en cours…
            </p>
          ) : (
            analyseEnAttente && (
              <p className="mt-2 text-[11px] text-[#C87F3A]">
                {analyse?.statut === 'echec' ? 'Analyse en échec' : 'Analyse en attente'}
              </p>
            )
          )}
        </div>
        <div className="col-span-2 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-[#1B2A41]">Données extraites</h3>
            <div className="flex gap-3">
              {candidature.cvFichierId && (
                <button
                  onClick={() => void voirCvCandidature(candidature.id as string)}
                  className="flex items-center gap-1 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
                >
                  <FileText size={13} /> Voir le CV
                </button>
              )}
              {peutDecider && (
                <button
                  onClick={relancerAnalyse}
                  disabled={relancerMutation.isPending}
                  className="flex items-center gap-1.5 text-[12px] text-[#6B7280] hover:text-[#1B2A41] disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
                >
                  {relancerMutation.isPending && <Spinner size="small" />}
                  {relancerMutation.isPending ? 'Analyse en cours…' : "Relancer l'analyse"}
                </button>
              )}
            </div>
          </div>
          <p className="text-[12px] text-[#6B7280]">
            {analyse?.justificationScore ?? "Extrait automatiquement par l'analyse IA du CV."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(analyse?.motsCles ?? []).map((t) => (
              <span
                key={t}
                className="rounded bg-[#4A7C6B]/10 px-2 py-0.5 text-[11px] text-[#4A7C6B]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {candidature.messageCandidat && candidature.messageCandidat.trim() !== '' && (
        <div className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-2 text-[12px] font-semibold text-[#1B2A41]">Message du candidat</h3>
          <p className="mb-3 text-[11px] text-[#9CA3AF]">
            Corps de l'e-mail de candidature — jamais extrait du CV, écrit directement par le
            candidat.
          </p>
          <p className="text-[12px] whitespace-pre-line text-[#1B2A41]">
            {candidature.messageCandidat}
          </p>
        </div>
      )}

      {candidature.statut === 'suggestion_reactivation' && peutDecider && (
        <div className="mt-5 rounded-xl border border-[#C87F3A]/30 bg-[#C87F3A]/8 p-5">
          <h3 className="mb-2 text-[12px] font-semibold text-[#1B2A41]">
            Suggestion de réactivation (EF-REC-12)
          </h3>
          <p className="mb-3 text-[12px] text-[#6B7280]">
            Cette candidature était "En attente" et correspond aux mots-clés d'une offre récente.
          </p>
          <Button loading={reactivationMutation.isPending} onClick={validerReactivation}>
            Réintégrer au pipeline
          </Button>
        </div>
      )}

      {/* EF-REC-09 : le résultat de l'entretien reste visible à l'Admin pour la décision finale
          même une fois l'étape "Entretien" passée (auto-avancée vers "Décision") — jamais une
          conversation hors application. Affiché dès qu'un entretien existe, pas seulement pendant
          l'étape "Entretien" elle-même. */}
      {dernierEntretien && (
        <div className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[12px] font-semibold text-[#1B2A41]">Entretien</h3>
          {dernierEntretien.dateEntretien && (
            <p className="mb-3 text-[13px] text-[#1B2A41]">
              Prévu le{' '}
              <strong>
                {format(new Date(dernierEntretien.dateEntretien), "dd/MM/yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </strong>
              {managerAssigne && <> avec {libelleManager(managerAssigne)}</>}
            </p>
          )}
          {entretienResolu ? (
            <div>
              <StatusTag statut={formatStatut(dernierEntretien!.resultat!)} />
              {dernierEntretien?.commentaire && (
                <p className="mt-2 text-[13px] text-[#6B7280]">{dernierEntretien.commentaire}</p>
              )}
            </div>
          ) : candidature.statut === 'entretien' && estManagerAssigne ? (
            <>
              <div className="flex gap-3">
                <Button
                  variant="success"
                  loading={entretienMutation.isPending}
                  onClick={() => soumettreEntretien('favorable')}
                >
                  Favorable
                </Button>
                <Button
                  variant="secondary"
                  loading={entretienMutation.isPending}
                  onClick={() => soumettreEntretien('defavorable')}
                >
                  Défavorable
                </Button>
              </div>
              <textarea
                value={commentaireEntretien}
                onChange={(e) => setCommentaireEntretien(e.target.value)}
                placeholder="Commentaire d'entretien…"
                className="mt-3 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-3 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                rows={3}
              />
            </>
          ) : (
            <p className="text-[13px] text-[#9CA3AF]">En attente du résultat d'entretien.</p>
          )}
        </div>
      )}

      {peutDecider && (
        <div className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[12px] font-semibold text-[#1B2A41]">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {candidature.statut === 'recu' && (
              <>
                <Button onClick={() => changerStatut('preselectionne')}>Présélectionner</Button>
                <Button variant="danger" onClick={() => setDialogRejet(true)}>
                  Rejeter
                </Button>
              </>
            )}
            {candidature.statut === 'preselectionne' && (
              <>
                <Button onClick={() => setDialogPlanification('creation')}>
                  Passer à l'entretien
                </Button>
                <Button variant="danger" onClick={() => setDialogRejet(true)}>
                  Rejeter
                </Button>
              </>
            )}
            {/* EF-REC-09 : pendant l'étape Entretien, l'Admin ne peut que reprogrammer ou rejeter —
                jamais saisir de résultat (Manager uniquement) ni forcer manuellement "Décision"
                (transition automatique, cf. plan). */}
            {candidature.statut === 'entretien' && !entretienResolu && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setDialogPlanification('reprogrammation')}
                >
                  Reprogrammer
                </Button>
                <Button variant="danger" onClick={() => setDialogRejet(true)}>
                  Rejeter
                </Button>
              </>
            )}
            {candidature.statut === 'decision' && (
              <>
                <Button variant="success" onClick={() => changerStatut('embauche')}>
                  Marquer "Embauché"
                </Button>
                <Button variant="danger" onClick={() => setDialogRejet(true)}>
                  Rejeter
                </Button>
              </>
            )}
            {candidature.statut === 'embauche' &&
              // EF-EMP-05 : "l'Admin ouvre 'Nouvel employé'" (plan T3.B1) — jamais délégable,
              // contrairement aux décisions de recrutement ci-dessus : EmployeController#creer()
              // est strictement hasRole('ADMIN'), sans extension délégué (bug repéré le
              // 2026-07-23 : le bouton restait visible et cliquable pour un délégué, qui
              // atterrissait sur un formulaire dont la soumission échouait silencieusement en 403).
              (role === 'admin' ? (
                <Button onClick={() => navigate(`/employes?depuisCandidatureId=${candidature.id}`)}>
                  Créer la fiche employé
                </Button>
              ) : (
                <p className="text-[13px] text-[#9CA3AF]">
                  Seul un Admin peut créer la fiche employé.
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
