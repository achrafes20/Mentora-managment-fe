import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MOCK_CANDIDATES } from '@/lib/mockData'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'

export function CandidatDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const candidate = MOCK_CANDIDATES.find((c) => c.id === id)

  if (!candidate) {
    return (
      <div className="p-8">
        <p className="text-[#C1495A]">Candidature introuvable</p>
      </div>
    )
  }

  const scoreColor =
    (candidate.score ?? 0) >= 80 ? '#4A7C6B' : (candidate.score ?? 0) >= 60 ? '#C87F3A' : '#C1495A'

  return (
    <div className="flex-1 overflow-auto p-8">
      <button
        onClick={() => navigate('/recrutement')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour au pipeline
      </button>
      <PageHeader
        title={`${candidate.prenom} ${candidate.nom}`}
        subtitle={candidate.poste}
        actions={<StatusTag statut={candidate.etape} />}
      />

      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Score IA
          </p>
          <p
            style={{ fontFamily: 'var(--font-display)', color: scoreColor }}
            className="mt-2 text-[48px] font-semibold leading-none"
          >
            {candidate.score ?? '—'}
            {candidate.score !== null && '%'}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[12px] font-semibold text-[#1B2A41]">Données extraites</h3>
          <p className="text-[12px] text-[#6B7280]">
            Extrait automatiquement par l'analyse IA du CV.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {candidate.tags.map((t) => (
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

      {candidate.etape === 'Entretien' && (
        <div className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[12px] font-semibold text-[#1B2A41]">
            Résultat d'entretien (Manager)
          </h3>
          <div className="flex gap-3">
            <button className="rounded-lg border border-[#4A7C6B] bg-[#4A7C6B]/10 px-4 py-2 text-[12px] text-[#4A7C6B]">
              Favorable
            </button>
            <button className="rounded-lg border border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280]">
              Défavorable
            </button>
          </div>
          <textarea
            placeholder="Commentaire d'entretien…"
            className="mt-3 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-3 text-[13px] focus:border-[#1B2A41] focus:outline-none"
            rows={3}
          />
        </div>
      )}
    </div>
  )
}

export function OffresPage() {
  const navigate = useNavigate()
  const [offres] = useState([
    {
      id: '1',
      titre: 'Développeur Full Stack',
      dept: 'Technologie',
      statut: 'Ouverte',
      candidats: 4,
    },
    {
      id: '2',
      titre: 'Chef de Projet Digital',
      dept: 'Technologie',
      statut: 'Ouverte',
      candidats: 2,
    },
  ])

  return (
    <div className="flex-1 overflow-auto p-8">
      <button
        onClick={() => navigate('/recrutement')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour au recrutement
      </button>
      <PageHeader
        title="Offres d'emploi"
        subtitle={`${offres.length} offre(s)`}
        actions={
          <button className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white">
            + Nouvelle offre
          </button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Intitulé', 'Département', 'Statut', 'Candidatures', ''].map((h) => (
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
            {offres.map((o) => (
              <tr
                key={o.id}
                className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
              >
                <td className="px-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">{o.titre}</td>
                <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">{o.dept}</td>
                <td className="px-4 py-3.5">
                  <StatusTag statut={o.statut === 'Ouverte' ? 'Actif' : 'Inactif'} />
                </td>
                <td
                  style={{ fontFamily: 'var(--font-code)' }}
                  className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                >
                  {o.candidats}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
