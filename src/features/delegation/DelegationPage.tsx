import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DELEGATION_ACTIVE } from '@/lib/mockData'
import { PageHeader } from '@/components/ui/StatCard'
import { CornerMark } from '@/components/ui/CornerMark'
import { MockBanner } from '@/components/ui/MockBanner'

export function DelegationPage() {
  const [active, setActive] = useState(true)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="delegation" />
      <PageHeader
        title="Délégation d'approbation"
        subtitle="Désigner un délégué temporaire"
        actions={
          !active && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white"
            >
              <Plus size={13} /> Déléguer temporairement
            </button>
          )
        }
      />

      {active ? (
        <div className="relative mb-6 max-w-md rounded-xl border border-[#D8D4CC] bg-white p-5">
          <CornerMark />
          <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            Délégation active
          </p>
          <p className="mt-2 text-[16px] font-semibold text-[#1B2A41]">
            {DELEGATION_ACTIVE.delegate}
          </p>
          <p className="mt-1 text-[12px] text-[#6B7280]">
            Jusqu'au{' '}
            <span style={{ fontFamily: 'var(--font-code)' }}>{DELEGATION_ACTIVE.until}</span>
          </p>
          <button
            onClick={() => setActive(false)}
            className="mt-4 rounded-lg border border-[#C1495A]/30 px-3 py-1.5 text-[12px] text-[#C1495A] hover:bg-[#C1495A]/8"
          >
            Révoquer
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-[#D8D4CC] bg-white p-8 text-center">
          <p className="text-[13px] text-[#6B7280]">Aucune délégation active</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 max-w-md rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-[#1B2A41]">Nouvelle délégation</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-[#6B7280]">Délégué</label>
              <select className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]">
                <option>Sophie Martin (Manager)</option>
                <option>Nour El Hassani (Admin)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#6B7280]">Date de début</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12px] text-[#6B7280]">Date de fin</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Le délégué obtient les droits d'approbation des demandes et de décision de
              recrutement. Pas de gestion des comptes ni de configuration.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActive(true)
                  setShowForm(false)
                }}
                className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] text-white"
              >
                Activer
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Historique</h3>
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Délégué', 'Période', 'Statut'].map((h) => (
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
            <tr className="hover:bg-[#F7F7F4]">
              <td className="px-4 py-3.5 text-[13px] text-[#1B2A41]">Sophie Martin</td>
              <td
                style={{ fontFamily: 'var(--font-code)' }}
                className="px-4 py-3.5 text-[12px] text-[#6B7280]"
              >
                01/07 – 15/07/2024
              </td>
              <td className="px-4 py-3.5 text-[12px] text-[#4A7C6B]">Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
