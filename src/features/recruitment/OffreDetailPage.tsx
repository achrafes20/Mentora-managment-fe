import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { EmailLink } from '@/components/ui/EmailLink'
import { formatStatut } from '@/components/ui/tokens'
import { useDepartements } from '@/features/employee/useDepartements'
import { useCandidatures, useOffre } from './useRecruitment'

export function OffreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: offre, isLoading: chargementOffre } = useOffre(id)
  const { data: departements } = useDepartements()
  const { data: page, isLoading: chargementCandidatures } = useCandidatures({
    offreId: id,
    size: 200,
  })
  const candidatures = page?.content ?? []

  function departementNom(depId?: string) {
    return departements?.find((d) => d.id === depId)?.nom ?? '—'
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <button
        onClick={() => navigate('/recrutement/offres')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour aux offres
      </button>

      {chargementOffre ? (
        <p className="text-[13px] text-[#9CA3AF]">Chargement…</p>
      ) : (
        <PageHeader
          title={offre?.intitule ?? 'Offre'}
          subtitle={`${departementNom(offre?.departementId)} · ${candidatures.length} candidature(s)`}
          actions={offre?.statut ? <StatusTag statut={formatStatut(offre.statut)} /> : undefined}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {chargementCandidatures ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Candidat', 'E-mail', 'Statut', 'Score'].map((h) => (
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
              {candidatures.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/recrutement/${c.id}`)}
                  className="cursor-pointer border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="px-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">
                    {c.prenom || c.nom ? `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                    <EmailLink email={c.email} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={formatStatut(c.statut ?? '')} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {c.derniereAnalyse?.scoreCorrespondance != null
                      ? `${c.derniereAnalyse.scoreCorrespondance}%`
                      : '—'}
                  </td>
                </tr>
              ))}
              {candidatures.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                    Aucune candidature pour cette offre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
