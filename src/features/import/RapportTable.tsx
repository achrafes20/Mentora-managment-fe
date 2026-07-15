import { useState } from 'react'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import type { ImportLigne } from './importApi'

export function RapportTable({ lignes }: { lignes: ImportLigne[] }) {
  const [erreursSeulement, setErreursSeulement] = useState(false)
  const lignesAffichees = erreursSeulement ? lignes.filter((l) => l.statut === 'ERREUR') : lignes

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[12px] text-[#6B7280]">
        <input
          type="checkbox"
          checked={erreursSeulement}
          onChange={(e) => setErreursSeulement(e.target.checked)}
        />
        Erreurs seulement
      </label>
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead className="sticky top-0">
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Ligne', 'Statut', 'Action', 'Détails'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesAffichees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-[#9CA3AF]">
                  Aucune ligne à afficher.
                </td>
              </tr>
            )}
            {lignesAffichees.map((ligne) => (
              <tr key={ligne.numeroLigne} className="border-b border-[#D8D4CC]/50">
                <td className="px-4 py-3 text-[13px] text-[#1B2A41]">{ligne.numeroLigne}</td>
                <td className="px-4 py-3">
                  <StatusTag statut={formatStatut(ligne.statut ?? '')} />
                </td>
                <td className="px-4 py-3 text-[13px] text-[#1B2A41]">
                  {formatStatut(ligne.action ?? '')}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#6B7280]">
                  {ligne.erreurs && ligne.erreurs.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {ligne.erreurs.map((erreur, i) => (
                        <li key={i}>{erreur}</li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
