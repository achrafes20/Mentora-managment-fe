import { useState } from 'react'
import { PointagesPage } from './PointagesPage'
import { AnomaliesPage } from './AnomaliesPage'
import { HorairesReferencePage } from './HorairesReferencePage'
import { PageHeader } from '@/components/ui/StatCard'

type Tab = 'pointages' | 'anomalies' | 'horaires'

export function PresencePage() {
  const [tab, setTab] = useState<Tab>('pointages')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pointages', label: 'Historique pointages' },
    { key: 'anomalies', label: 'Anomalies' },
    { key: 'horaires', label: 'Horaires de référence' },
  ]

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Présence"
        subtitle="Pointages, anomalies et horaires"
        actions={
          <a
            href="/kiosque"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            Ouvrir le kiosque →
          </a>
        }
      />

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

      {tab === 'pointages' && <PointagesPage />}
      {tab === 'anomalies' && <AnomaliesPage />}
      {tab === 'horaires' && <HorairesReferencePage />}
    </div>
  )
}
