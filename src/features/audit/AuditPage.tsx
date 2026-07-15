import { Download } from 'lucide-react'
import { MOCK_AUDIT_LOG } from '@/lib/mockData'
import { PageHeader } from '@/components/ui/StatCard'
import { MockBanner } from '@/components/ui/MockBanner'

export function AuditPage() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="audit" />
      <PageHeader
        title="Journal d'audit"
        subtitle="Lecture seule — aucune modification possible"
        actions={
          <button className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
            <Download size={13} /> Exporter
          </button>
        }
      />

      <div className="mb-5 flex gap-3">
        <input
          placeholder="Rechercher un utilisateur ou un élément…"
          className="flex-1 rounded-lg border border-[#D8D4CC] bg-white px-4 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
        />
        <select className="rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280]">
          <option>Toutes les actions</option>
          <option>Création</option>
          <option>Modification</option>
          <option>Approbation</option>
        </select>
        <select className="rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280]">
          <option>Tous les modules</option>
          <option>Employé</option>
          <option>Présence</option>
          <option>Recrutement</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Date/Heure', 'Utilisateur', 'Action', 'Module', 'Élément', 'Détail'].map((h) => (
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
            {MOCK_AUDIT_LOG.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
              >
                <td
                  style={{ fontFamily: 'var(--font-code)' }}
                  className="px-4 py-3.5 text-[11px] text-[#9CA3AF]"
                >
                  {row.datetime}
                </td>
                <td className="px-4 py-3.5 text-[12px] text-[#1B2A41]">{row.user}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{row.action}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{row.module}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{row.element}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#9CA3AF]">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
