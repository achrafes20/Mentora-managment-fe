import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/StatCard'

export function ImportPage() {
  const navigate = useNavigate()
  const [uploaded, setUploaded] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <div className="flex-1 overflow-auto p-8">
      <button
        onClick={() => navigate('/employes')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour aux employés
      </button>
      <PageHeader title="Import Excel/CSV" subtitle="Migration de données en masse" />

      {!uploaded ? (
        <div
          onClick={() => setUploaded(true)}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D4CC] bg-white p-12 transition-colors hover:border-[#1B2A41]"
        >
          <Upload size={32} className="mb-3 text-[#9CA3AF]" />
          <p className="text-[14px] font-medium text-[#1B2A41]">Glisser-déposer un fichier</p>
          <p className="mt-1 text-[12px] text-[#9CA3AF]">Formats acceptés : .xlsx, .csv</p>
        </div>
      ) : !done ? (
        <div>
          <div className="mb-4 overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                  {['Nom', 'Prénom', 'Département', 'Type contrat'].map((h) => (
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
                <tr className="border-b border-[#D8D4CC]/50">
                  <td className="px-4 py-3 text-[13px]">Benali</td>
                  <td className="px-4 py-3 text-[13px]">Karim</td>
                  <td className="px-4 py-3 text-[13px]">Technologie</td>
                  <td className="px-4 py-3 text-[13px]">CDI</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setDone(true)}
            className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] text-white"
          >
            Lancer l'import (dry-run)
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#4A7C6B]/30 bg-[#4A7C6B]/6 p-5">
          <p className="text-[14px] font-medium text-[#4A7C6B]">
            12 lignes importées avec succès, 0 lignes en erreur
          </p>
        </div>
      )}
    </div>
  )
}
