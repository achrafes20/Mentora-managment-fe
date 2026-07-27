import dayjs from 'dayjs'
import { format as formatDate } from 'date-fns'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { toast } from '@/components/ui/toast'
import { StatusTag } from '@/components/ui/StatusTag'
import { exporterPresence, listerPointages, type PointageReponse } from './api'
import { listerEmployes } from '../employee/employesApi'

function debutDuMois(): Date {
  const date = new Date()
  date.setDate(1)
  return date
}

export function PointagesPage() {
  const [data, setData] = useState<PointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [employes, setEmployes] = useState<Record<string, string>>({})
  const [optionsEmployes, setOptionsEmployes] = useState<{ id: string; nom: string }[]>([])
  const [employeExportId, setEmployeExportId] = useState('')
  const [debutExport, setDebutExport] = useState<Date | null>(debutDuMois())
  const [finExport, setFinExport] = useState<Date | null>(new Date())
  const [showExport, setShowExport] = useState(false)
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
        const options: { id: string; nom: string }[] = []
        for (const e of res.content ?? []) {
          if (!e.id) continue
          const nom = `${e.nom} ${e.prenom}`
          map[e.id] = nom
          options.push({ id: e.id, nom })
        }
        setEmployes(map)
        setOptionsEmployes(options)
      } catch {
        // ignore
      }
    }
    void chargerEmployes()
  }, [charger])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function lancerExport(fmt: 'xlsx' | 'pdf') {
    if (!debutExport || !finExport) {
      void toast.error('Choisissez une période avant d’exporter')
      return
    }
    setShowExport(false)
    try {
      await exporterPresence(
        {
          employeId: employeExportId || undefined,
          debut: formatDate(debutExport, 'yyyy-MM-dd'),
          fin: formatDate(finExport, 'yyyy-MM-dd'),
        },
        fmt,
      )
    } catch {
      void toast.error("Échec de l'export")
    }
  }

  return (
    <div>
      {/* EF-EXP-02 : feuille de présence sur une période, distincte de l'historique paginé
          ci-dessous — l'export porte toujours sur l'ensemble filtré, jamais sur la page affichée. */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Employé</label>
          <select
            value={employeExportId}
            onChange={(e) => setEmployeExportId(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          >
            <option value="">Toute l'équipe</option>
            {optionsEmployes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Du</label>
          <DatePicker value={debutExport} onChange={setDebutExport} />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Au</label>
          <DatePicker value={finExport} onChange={setFinExport} />
        </div>
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowExport((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            <Download size={13} /> Exporter la feuille de présence
          </button>
          {showExport && (
            <div className="absolute top-full right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
              {(['xlsx', 'pdf'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => void lancerExport(fmt)}
                  className="block w-full px-4 py-2.5 text-left text-[12px] text-[#1B2A41] transition-colors hover:bg-[#F7F7F4]"
                >
                  {fmt === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
