import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { MOCK_REQUESTS } from '@/lib/mockData'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'

type Tab = 'liste' | 'conge' | 'registre'

export function DemandesPage() {
  const { role } = useAuth()
  const [tab, setTab] = useState<Tab>('liste')
  const [soldeEmploye] = useState(12)
  const [dureeDemandee, setDureeDemandee] = useState(0)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'liste', label: 'Liste des demandes' },
    { key: 'conge', label: 'Demande de congé' },
    { key: 'registre', label: 'Registre des mouvements' },
  ]

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Demandes administratives"
        subtitle="Congés, bons de sortie et documents"
        actions={
          role === 'admin' && (
            <button className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white">
              <Plus size={13} /> Nouvelle demande
            </button>
          )
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

      {tab === 'liste' && (
        <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Employé', 'Type', 'Détails', 'Date', 'Statut'].map((h) => (
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
              {MOCK_REQUESTS.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="px-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">
                    {r.employe}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">{r.type}</td>
                  <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{r.details}</td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[11px] text-[#9CA3AF]"
                  >
                    {r.date}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={r.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'conge' && (
        <div className="max-w-lg rounded-xl border border-[#D8D4CC] bg-white p-6">
          <div className="mb-5 rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/6 p-4 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
              Solde disponible
            </p>
            <p
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-[36px] font-semibold text-[#4A7C6B]"
            >
              {soldeEmploye} jours
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-[#1B2A41]">
                Durée demandée (jours)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={dureeDemandee || ''}
                onChange={(e) => setDureeDemandee(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
              />
            </div>
            {dureeDemandee > soldeEmploye && (
              <p className="text-[12px] text-[#C1495A]">
                Ce congé dépasse le solde disponible ({soldeEmploye} jours restants).
              </p>
            )}
            <button
              disabled={dureeDemandee <= 0 || dureeDemandee > soldeEmploye}
              className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-40"
            >
              Enregistrer la demande
            </button>
          </div>
        </div>
      )}

      {tab === 'registre' && (
        <div className="max-w-lg">
          <p
            style={{ fontFamily: 'var(--font-display)' }}
            className="mb-4 text-[32px] font-semibold text-[#1B2A41]"
          >
            {soldeEmploye} jours
          </p>
          <div className="space-y-3">
            {[
              { date: '01/07/2024', desc: 'Accumulation mensuelle', val: '+1,5j', solde: '12j' },
              { date: '25/06/2024', desc: 'Congé approuvé', val: '−2j', solde: '10,5j' },
              { date: '01/06/2024', desc: 'Accumulation mensuelle', val: '+1,5j', solde: '12,5j' },
            ].map((m) => (
              <div
                key={m.date}
                className="flex items-center justify-between rounded-lg border border-[#D8D4CC] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-[12px] text-[#1B2A41]">{m.desc}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{m.date}</p>
                </div>
                <div className="text-right">
                  <p
                    style={{ fontFamily: 'var(--font-code)' }}
                    className={`text-[13px] font-medium ${m.val.startsWith('+') ? 'text-[#4A7C6B]' : 'text-[#6B7280]'}`}
                  >
                    {m.val}
                  </p>
                  <p
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="text-[10px] text-[#9CA3AF]"
                  >
                    Solde : {m.solde}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
