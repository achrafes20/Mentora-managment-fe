import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/toast'
import { StatusTag } from '@/components/ui/StatusTag'
import { listerPointages, type PointageReponse } from './api'
import { listerEmployes } from '../employee/employesApi'

export function PointagesPage() {
  const [data, setData] = useState<PointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [employes, setEmployes] = useState<Record<string, string>>({})
  const pageSize = 20

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerPointages(page, pageSize)
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      void toast.error('Erreur au chargement des pointages')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger()
    const chargerEmployes = async () => {
      try {
        const res = await listerEmployes({ size: 1000 })
        const map: Record<string, string> = {}
        for (const e of res.content ?? []) {
          if (!e.id) continue
          map[e.id] = `${e.nom} ${e.prenom}`
        }
        setEmployes(map)
      } catch {
        // ignore
      }
    }
    void chargerEmployes()
  }, [charger])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {loading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : data.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Aucun pointage</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Employé', 'Type', 'Horodatage', 'Correction'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="py-3.5 pr-4 pl-5 text-[13px] text-[#1B2A41]">
                    {employes[p.employeId] ?? `${p.employeId.substring(0, 8)}…`}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={p.typeScan === 'entree' ? 'Actif' : 'En attente'} />
                    <span className="ml-2 text-[12px] text-[#6B7280]">
                      {p.typeScan === 'entree' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {dayjs(p.horodatage).format('DD/MM/YYYY HH:mm:ss')}
                  </td>
                  <td className="py-3.5 pr-5">
                    {p.corrigeManuellement ? (
                      <span className="text-[11px] text-[#C87F3A]" title={p.motifCorrection ?? ''}>
                        Corrigé
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#9CA3AF]">Original</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-[#9CA3AF]">{total} pointages</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#D8D4CC] p-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12px] text-[#6B7280]">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#D8D4CC] p-1.5 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
