import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { MOCK_CANDIDATES } from '@/lib/mockData'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { CornerMark } from '@/components/ui/CornerMark'
import { MockBanner } from '@/components/ui/MockBanner'

const PIPELINE_STEPS = [
  'Reçu',
  'Présélectionné',
  'Entretien',
  'Décision',
  'Embauché',
  'Rejeté',
] as const

export function RecruitmentPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [search, setSearch] = useState('')

  const filtered = MOCK_CANDIDATES.filter((c) => {
    const q = search.toLowerCase()
    return !q || `${c.prenom} ${c.nom} ${c.poste}`.toLowerCase().includes(q)
  })

  if (role === 'manager') {
    const entretiens = MOCK_CANDIDATES.filter((c) => c.etape === 'Entretien')
    return (
      <div className="flex-1 overflow-auto p-8">
        <MockBanner feature="recruitment" />
        <PageHeader
          title="Entretiens à réaliser"
          subtitle={`${entretiens.length} candidature(s)`}
        />
        <div className="space-y-3">
          {entretiens.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/recrutement/${c.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-[#D8D4CC] bg-white p-4 text-left transition-colors hover:bg-[#F7F7F4]"
            >
              <div>
                <p className="text-[14px] font-medium text-[#1B2A41]">
                  {c.prenom} {c.nom}
                </p>
                <p className="text-[12px] text-[#6B7280]">{c.poste}</p>
              </div>
              <StatusTag statut={c.etape} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="recruitment" />
      <PageHeader
        title="Recrutement"
        subtitle="Pipeline des candidatures"
        actions={
          <>
            <button
              onClick={() => navigate('/recrutement/offres')}
              className="rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
            >
              Offres d'emploi
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#243650]">
              <Plus size={13} /> Ajouter une candidature
            </button>
          </>
        }
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une candidature (nom, e-mail)…"
        className="mb-5 w-full rounded-lg border border-[#D8D4CC] bg-white px-4 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STEPS.map((step) => {
          const cards = filtered.filter((c) => c.etape === step)
          return (
            <div key={step} className="w-[220px] flex-shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-[#6B7280]">{step}</span>
                <span
                  style={{ fontFamily: 'var(--font-code)' }}
                  className="text-[10px] text-[#9CA3AF]"
                >
                  {cards.length}
                </span>
              </div>
              <div className="space-y-2">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/recrutement/${c.id}`)}
                    className="relative w-full rounded-xl border border-[#D8D4CC] bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <CornerMark />
                    <p className="text-[12px] font-medium text-[#1B2A41]">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#6B7280]">{c.poste}</p>
                    {c.analyseEnAttente ? (
                      <span className="mt-2 inline-block text-[10px] text-[#C87F3A]">
                        Analyse en attente
                      </span>
                    ) : (
                      <p
                        style={{ fontFamily: 'var(--font-display)' }}
                        className="mt-2 text-[20px] font-semibold text-[#4A7C6B]"
                      >
                        {c.score}%
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-[#D8D4CC]/40 px-1.5 py-0.5 text-[9px] text-[#6B7280]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
