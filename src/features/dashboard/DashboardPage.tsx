import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, UserCheck2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import {
  useDelegationActive,
  useUtilisateursPourDelegation,
} from '@/features/delegation/useDelegation'
import { CornerMark } from '@/components/ui/CornerMark'
import { PageHeader, StatCard } from '@/components/ui/StatCard'
import { useDashboardStatsAdmin, useDashboardStatsManager } from './useDashboard'
import type { DashboardStats, RepartitionDepartement } from './dashboardApi'

// ─── Carte Employés Actifs (Admin) ────────────────────────────────────────────

function EmployeesActiveCard({
  onClick,
  count,
  repartition,
  loading,
}: {
  onClick: () => void
  count: number
  repartition: RepartitionDepartement[] | null
  loading: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl border border-[#D8D4CC] bg-white p-5 text-left transition-all hover:-translate-y-[2px] hover:shadow-md"
    >
      <CornerMark />
      <p className="mb-3 text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
        Employés actifs
      </p>
      <p
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-[38px] leading-none font-semibold text-[#1B2A41]"
      >
        {loading ? '…' : count}
      </p>
      {repartition && repartition.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-0">
          {repartition.slice(0, 5).map((d, i) => (
            <span key={d.departementId} className="flex items-center">
              {i > 0 && <span className="mx-1 text-[10px] text-[#D8D4CC]">·</span>}
              <span className="text-[10px] text-[#6B7280]">
                <span className="font-medium text-[#1B2A41]/70">
                  {d.nom.slice(0, 4).toUpperCase()}
                </span>{' '}
                {d.count}
              </span>
            </span>
          ))}
        </div>
      )}
      <div className="absolute right-0 bottom-0 left-0 h-[2px] rounded-b-xl bg-[#1B2A41] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

// ─── Carte Fin de contrat imminente (Admin) ────────────────────────────────────

function FinContratAlert({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null
  return (
    <div className="rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/6 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#C1495A]" />
        <div>
          <p className="text-[12px] font-semibold text-[#C1495A]">
            {count} fin{count > 1 ? 's' : ''} de contrat dans les 7 jours
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#C1495A]/70">
            Employé{count > 1 ? 's' : ''} (CDD, stage) dont le contrat arrive à échéance cette
            semaine.
          </p>
          <button
            onClick={onClick}
            className="mt-2 text-[11px] font-medium text-[#C1495A] underline underline-offset-2"
          >
            Voir les documents →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Squelette de chargement ──────────────────────────────────────────────────

function LoadingGrid({ cols }: { cols: number }) {
  return (
    <div className={`mb-8 grid grid-cols-${cols} gap-4`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-[#D8D4CC] bg-white p-5"
        />
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { role } = useAuth()

  // Délégation (EF-DASH-05)
  const { data: delegationActive } = useDelegationActive()
  const { data: utilisateurs } = useUtilisateursPourDelegation()
  const nomDelegue = utilisateurs?.find((u) => u.id === delegationActive?.delegueId)
  const nomDelegueAffiche = nomDelegue ? `${nomDelegue.prenom} ${nomDelegue.nom}` : '—'
  const aujourdHui = new Date().toISOString().slice(0, 10)
  const delegationPlanifiee = Boolean(
    delegationActive?.dateDebut && delegationActive.dateDebut > aujourdHui,
  )

  // Stats réelles (EF-DASH-01/02)
  const { data: statsAdmin, isLoading: loadingAdmin } = useDashboardStatsAdmin()

  const { data: statsManager, isLoading: loadingManager } = useDashboardStatsManager()

  // Choisir la source de données selon le rôle
  const stats: DashboardStats | undefined = role === 'admin' ? statsAdmin : statsManager
  const loading = role === 'admin' ? loadingAdmin : loadingManager

  // Cartes Admin (EF-DASH-01) — construites dynamiquement depuis les vraies données
  const adminCards = stats
    ? [
        {
          label: 'Demandes en attente',
          value: stats.demandesEnAttente,
          sub: stats.demandesEnAttente === 0 ? 'Aucune demande' : 'Demandes administratives',
          accentColor: '#C87F3A',
          path: '/demandes',
        },
        {
          label: 'Anomalies du jour',
          value: stats.anomaliesDuJour,
          sub: "Pointages non résolus aujourd'hui",
          accentColor: '#C1495A',
          path: '/presence',
        },
        {
          label: 'Candidatures en cours',
          value: stats.candidaturesEnCours ?? 0,
          sub: 'Pipeline actif (hors archivé/rejeté)',
          accentColor: '#C87F3A',
          path: '/recrutement',
        },
        {
          label: 'Fins de contrat < 7j',
          value: stats.finContratDans7Jours ?? 0,
          sub: 'CDD et stages en fin de période',
          accentColor: '#C1495A',
          path: '/documents',
        },
      ]
    : []

  // Cartes Manager (EF-DASH-02) — vue réduite au périmètre du Manager
  const managerCards = stats
    ? [
        {
          label: 'Effectif équipe',
          value: stats.employesActifs,
          sub: 'Employés actifs dans mon département',
          accentColor: '#1B2A41',
          path: '/employes',
        },
        {
          label: 'Demandes en attente',
          value: stats.demandesEnAttente,
          sub: 'Mon équipe',
          accentColor: '#C87F3A',
          path: '/demandes',
        },
        {
          label: 'Anomalies du jour',
          value: stats.anomaliesDuJour,
          sub: "Pointages non résolus aujourd'hui",
          accentColor: '#C1495A',
          path: '/presence',
        },
      ]
    : []

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Bandeau délégation active (EF-DASH-05) */}
        {role === 'admin' && delegationActive && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#D8D4CC] bg-[#D8D4CC]/30 px-4 py-3">
            <UserCheck2 size={14} className="flex-shrink-0 text-[#1B2A41]" />
            <p className="flex-1 text-[12px] text-[#1B2A41]">
              {delegationPlanifiee ? (
                <>
                  Délégation planifiée — <strong>{nomDelegueAffiche}</strong> pourra approuver les
                  demandes du{' '}
                  <span style={{ fontFamily: 'var(--font-code)' }}>
                    {delegationActive.dateDebut}
                  </span>{' '}
                  au{' '}
                  <span style={{ fontFamily: 'var(--font-code)' }}>{delegationActive.dateFin}</span>
                  .
                </>
              ) : (
                <>
                  Délégation active — <strong>{nomDelegueAffiche}</strong> peut approuver les
                  demandes jusqu'au{' '}
                  <span style={{ fontFamily: 'var(--font-code)' }}>{delegationActive.dateFin}</span>
                  .
                </>
              )}
            </p>
            <button
              onClick={() => navigate('/delegation')}
              className="flex flex-shrink-0 items-center gap-0.5 text-[11px] text-[#4A7C6B] hover:underline"
            >
              Gérer →
            </button>
          </div>
        )}

        <PageHeader
          title="Tableau de bord"
          subtitle={
            <>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </>
          }
        />

        {/* ── Grille de cartes ── */}
        {role === 'admin' ? (
          loading ? (
            <LoadingGrid cols={5} />
          ) : (
            <div className="mb-8 grid grid-cols-5 gap-4">
              {/* Carte employés actifs avec répartition par département (EF-DASH-01) */}
              <EmployeesActiveCard
                onClick={() => navigate('/employes')}
                count={stats?.employesActifs ?? 0}
                repartition={stats?.repartitionParDepartement ?? null}
                loading={loading}
              />
              {adminCards.map((c) => (
                <StatCard key={c.label} {...c} onClick={() => navigate(c.path)} />
              ))}
            </div>
          )
        ) : loading ? (
          <LoadingGrid cols={3} />
        ) : (
          <div className="mb-8 grid grid-cols-3 gap-4">
            {managerCards.map((c) => (
              <StatCard key={c.label} {...c} onClick={() => navigate(c.path)} />
            ))}
          </div>
        )}

        {/* ── Section Admin : alertes fins de contrat (EF-DASH-01/03) ── */}
        {role === 'admin' && !loading && stats && (
          <div className="grid grid-cols-3 gap-5">
            {/* Panel "Demandes récentes" — lien rapide vers les demandes en attente */}
            <div className="col-span-2 overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
              <div className="flex items-center justify-between border-b border-[#D8D4CC] bg-[#F7F7F4] px-5 py-3">
                <h2 className="text-[12px] font-semibold text-[#1B2A41]">Récapitulatif rapide</h2>
                <button
                  onClick={() => navigate('/demandes')}
                  className="flex items-center gap-0.5 text-[11px] text-[#4A7C6B] hover:underline"
                >
                  Voir les demandes <ChevronRight size={11} />
                </button>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    {
                      label: 'Employés actifs (total)',
                      value: stats.employesActifs,
                      urgent: false,
                      path: '/employes',
                    },
                    {
                      label: 'Demandes en attente',
                      value: stats.demandesEnAttente,
                      urgent: stats.demandesEnAttente > 0,
                      path: '/demandes',
                    },
                    {
                      label: 'Anomalies de pointage du jour',
                      value: stats.anomaliesDuJour,
                      urgent: stats.anomaliesDuJour > 0,
                      path: '/presence',
                    },
                    {
                      label: 'Candidatures en cours',
                      value: stats.candidaturesEnCours ?? 0,
                      urgent: false,
                      path: '/recrutement',
                    },
                    {
                      label: 'Fins de contrat dans 7 jours',
                      value: stats.finContratDans7Jours ?? 0,
                      urgent: (stats.finContratDans7Jours ?? 0) > 0,
                      path: '/documents',
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      onClick={() => navigate(row.path)}
                      className="cursor-pointer border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                    >
                      <td className="px-5 py-3 text-[13px] font-medium text-[#1B2A41]">
                        {row.label}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[12px] font-semibold ${
                            row.urgent
                              ? 'bg-[#C1495A]/10 text-[#C1495A]'
                              : 'bg-[#F7F7F4] text-[#1B2A41]'
                          }`}
                        >
                          {row.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Panel alertes (EF-DASH-03 : cliquable → /documents) */}
            <div className="space-y-4">
              <FinContratAlert
                count={stats.finContratDans7Jours ?? 0}
                onClick={() => navigate('/documents')}
              />
              {(stats.finContratDans7Jours ?? 0) === 0 && (
                <div className="rounded-xl border border-[#D8D4CC] bg-[#F7F7F4] p-4 text-center text-[12px] text-[#9CA3AF]">
                  Aucune fin de contrat imminente
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
