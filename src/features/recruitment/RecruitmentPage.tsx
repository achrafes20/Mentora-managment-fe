import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { PageHeader } from '@/components/ui/StatCard'
import { CornerMark } from '@/components/ui/CornerMark'
import { Avatar } from '@/components/ui/Avatar'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import type { ApiError } from '@/lib/apiClient'
import { useDepartements } from '@/features/employee/useDepartements'
import { useEmployes } from '@/features/employee/useEmployes'
import { useCandidatures, useOffres, CLE_CANDIDATURES } from './useRecruitment'
import { changerStatutCandidature, type Candidature } from './recruitmentApi'
import { EntretienScheduleDialog } from './EntretienScheduleDialog'
import { RejectDialog } from './RejectDialog'

// EF-REC-07 : pipeline Reçu -> Présélectionné -> Entretien -> Décision -> Embauché/Rejeté.
// "en_attente"/"suggestion_reactivation"/"archivee" (EF-REC-11/12) sont transversaux, hors kanban.
// "Embauché" reste visible tant que la fiche employé n'a pas été créée (cf. filtrage plus bas).
const PIPELINE_STEPS = [
  'recu',
  'preselectionne',
  'entretien',
  'decision',
  'embauche',
  'rejete',
] as const

// Miroir client de CandidatureService.TRANSITIONS_AUTORISEES — "entretien" ne peut mener qu'à
// "rejete" manuellement, "decision" se déclenche automatiquement quand le Manager rend son
// résultat (jamais un glisser-déposer manuel vers cette colonne).
const TRANSITIONS_AUTORISEES: Record<string, string[]> = {
  recu: ['preselectionne', 'rejete'],
  preselectionne: ['entretien', 'rejete'],
  entretien: ['rejete'],
  decision: ['embauche', 'rejete'],
}

// Palette de colonnes — reprend les mêmes teintes que StatusTag/tokens.ts (neutre/ambre/succès/
// danger) pour rester cohérent avec le reste de l'app plutôt que d'inventer de nouvelles couleurs.
const STYLE_COLONNE: Record<
  string,
  { barre: string; puce: string; compteur: string; teinteBase: string; teinteSurvol: string }
> = {
  recu: {
    barre: 'bg-[#9CA3AF]',
    puce: 'bg-[#9CA3AF]',
    compteur: 'bg-[#9CA3AF]/10 text-[#6B7280]',
    teinteBase: '',
    teinteSurvol: 'bg-[#1B2A41]/[0.03] ring-2 ring-[#1B2A41]/15',
  },
  preselectionne: {
    barre: 'bg-[#C87F3A]',
    puce: 'bg-[#C87F3A]',
    compteur: 'bg-[#C87F3A]/10 text-[#C87F3A]',
    teinteBase: '',
    teinteSurvol: 'bg-[#C87F3A]/[0.06] ring-2 ring-[#C87F3A]/25',
  },
  entretien: {
    barre: 'bg-[#C87F3A]',
    puce: 'bg-[#C87F3A]',
    compteur: 'bg-[#C87F3A]/10 text-[#C87F3A]',
    teinteBase: '',
    teinteSurvol: 'bg-[#C87F3A]/[0.06] ring-2 ring-[#C87F3A]/25',
  },
  decision: {
    barre: 'bg-[#C87F3A]',
    puce: 'bg-[#C87F3A]',
    compteur: 'bg-[#C87F3A]/10 text-[#C87F3A]',
    teinteBase: '',
    teinteSurvol: 'bg-[#C87F3A]/[0.06] ring-2 ring-[#C87F3A]/25',
  },
  embauche: {
    barre: 'bg-[#4A7C6B]',
    puce: 'bg-[#4A7C6B]',
    compteur: 'bg-[#4A7C6B]/10 text-[#4A7C6B]',
    teinteBase: 'bg-[#4A7C6B]/[0.035]',
    teinteSurvol: 'bg-[#4A7C6B]/10 ring-2 ring-[#4A7C6B]/25',
  },
  rejete: {
    barre: 'bg-[#C1495A]',
    puce: 'bg-[#C1495A]',
    compteur: 'bg-[#C1495A]/10 text-[#C1495A]',
    teinteBase: 'bg-[#C1495A]/[0.035]',
    teinteSurvol: 'bg-[#C1495A]/10 ring-2 ring-[#C1495A]/25',
  },
}

function CandidatureCard({
  candidature,
  onDragStart,
}: {
  candidature: Candidature
  onDragStart: (id: string) => void
}) {
  const navigate = useNavigate()
  const analyse = candidature.derniereAnalyse
  const analyseEnAttente = !analyse || analyse.statut !== 'succes'
  const motsCles = analyse?.motsCles ?? []
  const nomAffiche =
    candidature.prenom || candidature.nom
      ? `${candidature.prenom ?? ''} ${candidature.nom ?? ''}`.trim()
      : candidature.email

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', candidature.id ?? '')
        onDragStart(candidature.id ?? '')
      }}
      onClick={() => navigate(`/recrutement/${candidature.id}`)}
      className="relative w-full cursor-grab rounded-xl border border-[#D8D4CC] bg-white p-3 text-left shadow-[0_1px_2px_rgba(27,42,65,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#1B2A41]/20 hover:shadow-md active:cursor-grabbing"
    >
      <CornerMark />
      <div className="flex items-center gap-2 pr-3">
        <Avatar prenom={candidature.prenom ?? ''} nom={candidature.nom ?? ''} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-[#1B2A41]">{nomAffiche}</p>
          <p className="truncate text-[10px] text-[#9CA3AF]">
            {candidature.intitulePosteDetecte ?? candidature.email}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-[#D8D4CC]/70 pt-2">
        {analyseEnAttente ? (
          <span className="text-[10px] text-[#C87F3A]">Analyse en attente</span>
        ) : (
          <p
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[18px] leading-none font-semibold text-[#4A7C6B]"
          >
            {analyse?.scoreCorrespondance ?? '—'}%
          </p>
        )}
        {motsCles.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1">
            {motsCles.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded bg-[#D8D4CC]/40 px-1.5 py-0.5 text-[9px] text-[#6B7280]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function RecruitmentPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [search, setSearch] = useState('')
  const [colonneSurvolee, setColonneSurvolee] = useState<string | null>(null)
  const [dialogEntretienId, setDialogEntretienId] = useState<string | null>(null)
  const [dialogRejetId, setDialogRejetId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: page, isLoading } = useCandidatures({ recherche: search || undefined, size: 200 })
  const { data: offres } = useOffres()
  const { data: departements } = useDepartements()
  const { data: pageEmployes } = useEmployes({ size: 500 })

  // Une fois la fiche employé créée depuis une candidature "Embauché", celle-ci quitte le
  // tableau (cf. commentaire sur PIPELINE_STEPS) — même chose pour "Rejeté" une fois le mail
  // envoyé (l'envoi est synchrone avec le changement de statut, donc dès qu'une candidature est
  // "rejete" c'est déjà traité, la colonne reste comme simple cible de glisser-déposer).
  const candidatureIdsEmbauchees = new Set(
    (pageEmployes?.content ?? [])
      .map((e) => e.candidatureOrigineId)
      .filter((id): id is string => !!id),
  )
  const candidatures = (page?.content ?? []).filter(
    (c) =>
      c.statut !== 'rejete' &&
      !(c.statut === 'embauche' && c.id && candidatureIdsEmbauchees.has(c.id)),
  )

  async function appliquerStatut(
    candidatureId: string,
    statut: string,
    managerId?: string,
    dateEntretien?: string,
    corpsMessage?: string,
  ) {
    try {
      await changerStatutCandidature(candidatureId, {
        statut: statut as never,
        managerId,
        dateEntretien,
        corpsMessage,
      })
      await queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES })
      toast.success(`Statut mis à jour : ${formatStatut(statut)}.`)
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  function managerResoluPour(candidature: Candidature) {
    const offre = offres?.find((o) => o.id === candidature.offreId)
    return departements?.find((d) => d.id === offre?.departementId)?.managerId ?? null
  }

  function onDropSurColonne(e: React.DragEvent, cibleStatut: string) {
    e.preventDefault()
    setColonneSurvolee(null)
    const candidatureId = e.dataTransfer.getData('text/plain')
    const candidature = candidatures.find((c) => c.id === candidatureId)
    if (!candidature || candidature.statut === cibleStatut) return

    const autorisees = TRANSITIONS_AUTORISEES[candidature.statut ?? ''] ?? []
    if (!autorisees.includes(cibleStatut)) {
      toast.error(
        `Transition non autorisée : ${formatStatut(candidature.statut ?? '')} → ${formatStatut(cibleStatut)}.`,
      )
      return
    }

    if (cibleStatut === 'entretien') {
      setDialogEntretienId(candidatureId)
      return
    }
    if (cibleStatut === 'rejete') {
      setDialogRejetId(candidatureId)
      return
    }
    confirm({
      title: `Passer en "${formatStatut(cibleStatut)}" ?`,
      onOk: () => appliquerStatut(candidatureId, cibleStatut),
    })
  }

  const candidatureEntretien = candidatures.find((c) => c.id === dialogEntretienId)

  if (role === 'manager') {
    const entretiens = candidatures.filter((c) => c.statut === 'entretien')

    return (
      <div className="flex-1 overflow-auto p-8">
        <PageHeader
          title="Entretiens à réaliser"
          subtitle={`${entretiens.length} candidature(s) en phase d'entretien qui vous sont assignées`}
        />

        {isLoading ? (
          <p className="text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : entretiens.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D8D4CC] bg-white/60 py-16 text-center">
            <CalendarCheck size={26} className="mb-3 text-[#D8D4CC]" />
            <p className="text-[13px] text-[#9CA3AF]">Aucun entretien à réaliser pour le moment.</p>
          </div>
        ) : (
          <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {entretiens.map((c) => {
              const score = c.derniereAnalyse?.scoreCorrespondance ?? null
              const scoreColor =
                score === null
                  ? '#9CA3AF'
                  : score >= 80
                    ? '#4A7C6B'
                    : score >= 60
                      ? '#C87F3A'
                      : '#C1495A'
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/recrutement/${c.id}`)}
                  className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-[#D8D4CC] bg-white p-4 text-left shadow-[0_1px_2px_rgba(27,42,65,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#1B2A41]/20 hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 h-full w-[3px] bg-[#C87F3A]" />
                  <Avatar prenom={c.prenom ?? ''} nom={c.nom ?? ''} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#1B2A41]">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="truncate text-[12px] text-[#6B7280]">
                      {c.intitulePosteDetecte ?? c.email}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p
                        style={{ fontFamily: 'var(--font-display)', color: scoreColor }}
                        className="text-[18px] leading-none font-semibold"
                      >
                        {score ?? '—'}
                        {score !== null && '%'}
                      </p>
                      <p className="mt-0.5 text-[9px] tracking-wide text-[#9CA3AF] uppercase">
                        Score IA
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-[#D8D4CC] transition-colors group-hover:text-[#9CA3AF]"
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <EntretienScheduleDialog
        open={dialogEntretienId !== null}
        title="Planifier l'entretien"
        managerParDefaut={candidatureEntretien ? managerResoluPour(candidatureEntretien) : null}
        dateParDefaut={null}
        onCancel={() => setDialogEntretienId(null)}
        onConfirm={(managerId, dateEntretien) => {
          if (dialogEntretienId) {
            void appliquerStatut(dialogEntretienId, 'entretien', managerId, dateEntretien)
          }
          setDialogEntretienId(null)
        }}
        submitting={false}
      />
      <RejectDialog
        open={dialogRejetId !== null}
        onCancel={() => setDialogRejetId(null)}
        onConfirm={(corps) => {
          if (dialogRejetId) {
            void appliquerStatut(dialogRejetId, 'rejete', undefined, undefined, corps)
          }
          setDialogRejetId(null)
        }}
        submitting={false}
      />

      <PageHeader
        title="Recrutement"
        subtitle="Pipeline des candidatures — glisser-déposer une carte pour changer son statut"
        actions={
          <button
            onClick={() => navigate('/recrutement/offres')}
            className="rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            Offres d'emploi
          </button>
        }
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une candidature (nom, e-mail)…"
        className="mb-5 w-full rounded-lg border border-[#D8D4CC] bg-white px-4 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      />

      {isLoading ? (
        <p className="text-[13px] text-[#9CA3AF]">Chargement…</p>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {PIPELINE_STEPS.map((step) => {
            const cards = candidatures.filter((c) => c.statut === step)
            const style = STYLE_COLONNE[step]
            const survolee = colonneSurvolee === step
            return (
              <div
                key={step}
                onDragOver={(e) => {
                  e.preventDefault()
                  setColonneSurvolee(step)
                }}
                onDragLeave={() => setColonneSurvolee((s) => (s === step ? null : s))}
                onDrop={(e) => onDropSurColonne(e, step)}
                className={`flex h-[70vh] w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#D8D4CC] bg-white shadow-sm transition-colors ${
                  survolee ? style.teinteSurvol : style.teinteBase
                }`}
              >
                <div className={`h-[3px] w-full flex-shrink-0 ${style.barre}`} />
                <div className="flex flex-shrink-0 items-center justify-between border-b border-[#D8D4CC]/70 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.puce}`} />
                    <span className="text-[11px] font-semibold tracking-wide text-[#1B2A41] uppercase">
                      {formatStatut(step)}
                    </span>
                  </div>
                  <span
                    style={{ fontFamily: 'var(--font-code)' }}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${style.compteur}`}
                  >
                    {cards.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
                  {cards.map((c) => (
                    <CandidatureCard key={c.id} candidature={c} onDragStart={() => {}} />
                  ))}
                  {cards.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[#D8D4CC] text-[11px] text-[#9CA3AF]">
                      Aucune candidature
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
