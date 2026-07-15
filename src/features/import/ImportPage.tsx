import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { ImportHistoriqueTab } from './ImportHistoriqueTab'
import { ImportWizard } from './ImportWizard'

type Vue = 'assistant' | 'historique'

export function ImportPage() {
  const navigate = useNavigate()
  const [vue, setVue] = useState<Vue>('assistant')

  return (
    <div className="flex-1 overflow-auto p-8">
      <button
        onClick={() => navigate('/employes')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour aux employés
      </button>
      <PageHeader title="Import Excel/CSV" subtitle="Migration de données en masse (EF-EMP-07)" />

      <div className="mb-6 flex gap-1 border-b border-[#D8D4CC]">
        {(
          [
            { key: 'assistant', label: "Assistant d'import" },
            { key: 'historique', label: 'Historique' },
          ] as const
        ).map((onglet) => (
          <button
            key={onglet.key}
            onClick={() => setVue(onglet.key)}
            className={cn(
              'px-4 py-2 text-[13px] font-medium transition-colors',
              vue === onglet.key
                ? 'border-b-2 border-[#1B2A41] text-[#1B2A41]'
                : 'text-[#9CA3AF] hover:text-[#1B2A41]',
            )}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {vue === 'assistant' ? <ImportWizard /> : <ImportHistoriqueTab />}
    </div>
  )
}
