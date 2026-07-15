import { PageHeader } from '@/components/ui/StatCard'
import { MockBanner } from '@/components/ui/MockBanner'

const DOCS_A_TRAITER = [
  {
    id: '1',
    nom: 'Nadia Bensalem',
    type: 'Certificat de stage',
    delai: 'J-3',
    poste: 'Designer UI/UX',
  },
  {
    id: '2',
    nom: 'Mehdi Ouali',
    type: 'Certificat de travail',
    delai: 'J-15',
    poste: 'Développeur Junior',
  },
]

const JOURNAL = [
  {
    date: '28/06/2024',
    par: 'Amal Medah',
    destinataire: 'Thomas Renard',
    document: 'Attestation de travail',
  },
  {
    date: '20/06/2024',
    par: 'Amal Medah',
    destinataire: 'Karim Benali',
    document: 'Certificat de stage',
  },
]

export function DocumentsPage() {
  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="documents" />
      <PageHeader title="Documents RH" subtitle="Certificats et envois de documents" />

      <h2 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">
        Documents de fin de contrat à traiter
      </h2>
      <div className="mb-8 space-y-3">
        {DOCS_A_TRAITER.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-[#D8D4CC] bg-white p-4"
          >
            <div>
              <p className="text-[14px] font-medium text-[#1B2A41]">{d.nom}</p>
              <p className="text-[12px] text-[#6B7280]">
                {d.poste} — {d.type}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  d.delai === 'J-3'
                    ? 'bg-[#C1495A]/10 text-[#C1495A]'
                    : 'bg-[#C87F3A]/10 text-[#C87F3A]'
                }`}
              >
                {d.delai}
              </span>
              <button className="rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[12px] text-white">
                Confirmer l'envoi
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Journal d'envoi</h2>
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Date', 'Envoyé par', 'Destinataire', 'Document'].map((h) => (
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
            {JOURNAL.map((j, i) => (
              <tr
                key={i}
                className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
              >
                <td
                  style={{ fontFamily: 'var(--font-code)' }}
                  className="px-4 py-3.5 text-[11px] text-[#9CA3AF]"
                >
                  {j.date}
                </td>
                <td className="px-4 py-3.5 text-[13px] text-[#1B2A41]">{j.par}</td>
                <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">{j.destinataire}</td>
                <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">{j.document}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
