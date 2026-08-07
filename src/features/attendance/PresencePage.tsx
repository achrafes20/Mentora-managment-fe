import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PresenceAujourdhuiPage } from './PresenceAujourdhuiPage'
import { PointagesPage } from './PointagesPage'
import { AnomaliesPage } from './AnomaliesPage'
import { HorairesReferencePage } from './HorairesReferencePage'
import { KiosqueActivationsPanel } from './KiosqueActivationsPanel'
import { PageHeader } from '@/components/ui/StatCard'
import { useAuth } from '@/lib/AuthContext'
import { useEstDelegueActifMaintenant } from '../delegation/useDelegation'

type Tab = 'aujourdhui' | 'pointages' | 'anomalies' | 'horaires' | 'kiosque'

const TABS_VALIDES: Tab[] = ['aujourdhui', 'pointages', 'anomalies', 'horaires', 'kiosque']

export function PresencePage() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    TABS_VALIDES.includes(tabParam as Tab) ? (tabParam as Tab) : 'aujourdhui',
  )
  const { role } = useAuth()
  const estDelegueActif = useEstDelegueActifMaintenant()
  // NFR-UX-02 : génération/révocation des codes réservée à l'Admin (ou délégué actif) côté
  // backend — même garde ici pour ne pas afficher un onglet qui renverrait 403.
  const peutGererKiosque = role === 'admin' || estDelegueActif

  const tabs: { key: Tab; label: string }[] = [
    { key: 'aujourdhui', label: "Aujourd'hui" },
    { key: 'pointages', label: 'Historique pointages' },
    { key: 'anomalies', label: 'Anomalies' },
    { key: 'horaires', label: 'Horaires de référence' },
    ...(peutGererKiosque ? [{ key: 'kiosque' as const, label: 'Pointage mobile' }] : []),
  ]

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Présence" subtitle="Pointages, anomalies et horaires" />

      <div className="mb-5 flex gap-1 border-b border-[#D8D4CC]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#C92B6A] text-[#1B2A41]'
                : 'text-[#6B7280] hover:text-[#1B2A41]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'aujourdhui' && <PresenceAujourdhuiPage />}
      {tab === 'pointages' && <PointagesPage />}
      {tab === 'anomalies' && <AnomaliesPage />}
      {tab === 'horaires' && <HorairesReferencePage />}
      {tab === 'kiosque' && peutGererKiosque && <KiosqueActivationsPanel />}
    </div>
  )
}
