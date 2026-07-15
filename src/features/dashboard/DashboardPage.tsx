import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, UserCheck2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { DELEGATION_ACTIVE, DEPT_BREAKDOWN, MOCK_REQUESTS } from '@/lib/mockData'
import { CornerMark } from '@/components/ui/CornerMark'
import { PageHeader, StatCard } from '@/components/ui/StatCard'
import { MockBanner } from '@/components/ui/MockBanner'
import { StatusTag } from '@/components/ui/StatusTag'

function EmployeesActiveCard({ onClick }: { onClick: () => void }) {
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
        47
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-0">
        {DEPT_BREAKDOWN.map((d, i) => (
          <span key={d.dept} className="flex items-center">
            {i > 0 && <span className="mx-1 text-[10px] text-[#D8D4CC]">·</span>}
            <span className="text-[10px] text-[#6B7280]">
              <span className="font-medium text-[#1B2A41]/70">{d.abbr}</span> {d.count}
            </span>
          </span>
        ))}
      </div>
      <div className="absolute right-0 bottom-0 left-0 h-[2px] rounded-b-xl bg-[#1B2A41] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { role } = useAuth()

  const adminCards = [
    {
      label: 'Demandes en attente',
      value: 3,
      sub: 'Dont 2 congés payés',
      accentColor: '#C87F3A',
      path: '/demandes',
    },
    {
      label: 'Anomalies de pointage',
      value: 2,
      sub: "Aujourd'hui",
      accentColor: '#C1495A',
      path: '/presence',
    },
    {
      label: 'Candidatures en attente',
      value: 8,
      sub: '2 en analyse IA',
      accentColor: '#C87F3A',
      path: '/recrutement',
    },
    {
      label: 'Fins de contrat < 7j',
      value: 1,
      sub: 'Nadia Bensalem — Stage',
      accentColor: '#C1495A',
      path: '/documents',
    },
  ]

  const managerCards = [
    {
      label: 'Effectif équipe',
      value: 5,
      sub: 'Technologie',
      accentColor: '#1B2A41',
      path: '/employes',
    },
    {
      label: 'Demandes en attente',
      value: 1,
      sub: 'Congé payé',
      accentColor: '#C87F3A',
      path: '/demandes',
    },
    {
      label: 'Anomalies du jour',
      value: 1,
      sub: 'Mehdi Ouali',
      accentColor: '#C1495A',
      path: '/presence',
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1200px] p-8">
        <MockBanner feature="dashboard" />
        {role === 'admin' && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#D8D4CC] bg-[#D8D4CC]/30 px-4 py-3">
            <UserCheck2 size={14} className="flex-shrink-0 text-[#1B2A41]" />
            <p className="flex-1 text-[12px] text-[#1B2A41]">
              Délégation active — <strong>{DELEGATION_ACTIVE.delegate}</strong> peut approuver les
              demandes jusqu'au{' '}
              <span style={{ fontFamily: 'var(--font-code)' }}>{DELEGATION_ACTIVE.until}</span>.
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

        {role === 'admin' ? (
          <div className="mb-8 grid grid-cols-5 gap-4">
            <EmployeesActiveCard onClick={() => navigate('/employes')} />
            {adminCards.map((c) => (
              <StatCard key={c.label} {...c} onClick={() => navigate(c.path)} />
            ))}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-3 gap-4">
            {managerCards.map((c) => (
              <StatCard key={c.label} {...c} onClick={() => navigate(c.path)} />
            ))}
          </div>
        )}

        {role === 'admin' && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
              <div className="flex items-center justify-between border-b border-[#D8D4CC] bg-[#F7F7F4] px-5 py-3">
                <h2 className="text-[12px] font-semibold text-[#1B2A41]">Demandes récentes</h2>
                <button
                  onClick={() => navigate('/demandes')}
                  className="flex items-center gap-0.5 text-[11px] text-[#4A7C6B] hover:underline"
                >
                  Voir tout <ChevronRight size={11} />
                </button>
              </div>
              <table className="w-full">
                <tbody>
                  {MOCK_REQUESTS.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                    >
                      <td className="px-5 py-3 text-[13px] font-medium text-[#1B2A41]">
                        {req.employe}
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[#6B7280]">{req.type}</td>
                      <td
                        style={{ fontFamily: 'var(--font-code)' }}
                        className="px-3 py-3 text-[11px] text-[#9CA3AF]"
                      >
                        {req.date}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StatusTag statut={req.statut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/6 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#C1495A]" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#C1495A]">
                      Fin de contrat dans 5 jours
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#C1495A]/70">
                      <span className="font-medium">Nadia Bensalem</span> (Stage) — contrat se
                      termine le 06/07/2024.
                    </p>
                    <button
                      onClick={() => navigate('/documents')}
                      className="mt-2 text-[11px] font-medium text-[#C1495A] underline underline-offset-2"
                    >
                      Traiter le certificat →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
