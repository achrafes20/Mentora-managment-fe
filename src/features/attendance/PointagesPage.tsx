import * as PopoverPrimitive from '@radix-ui/react-popover'
import dayjs from 'dayjs'
import { format as formatDate } from 'date-fns'
import { ChevronLeft, ChevronRight, Download, Info, Pencil, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { toast } from '@/components/ui/toast'
import { StatusTag } from '@/components/ui/StatusTag'
import { useAuth } from '@/lib/AuthContext'
import { corrigerPointage, exporterPresence, listerPointages, type PointageReponse } from './api'
import { listerEmployes } from '../employee/employesApi'
import { CorrigerPointageDialog } from './CorrigerPointageDialog'

function debutDuMois(): Date {
  const date = new Date()
  date.setDate(1)
  return date
}

// Clic plutôt que survol (title natif) : lisible au tactile, jamais tronqué, cohérent avec le
// Popover déjà utilisé par DatePicker.
function MotifCorrectionBadge({ motif }: { motif: string | null }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-[#C87F3A] hover:underline"
        >
          Corrigé <Info size={12} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          className="z-1000 max-w-[260px] rounded-lg border border-[#D8D4CC] bg-white p-3 text-[12px] shadow-lg"
        >
          <p className="mb-1 font-medium text-[#1B2A41]">Motif de la correction</p>
          <p className="text-[#6B7280]">{motif}</p>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export function PointagesPage() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const [data, setData] = useState<PointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [employes, setEmployes] = useState<Record<string, string>>({})
  const [optionsEmployes, setOptionsEmployes] = useState<{ id: string; nom: string }[]>([])
  const [showExport, setShowExport] = useState(false)
  const [pointageACorrige, setPointageACorrige] = useState<PointageReponse | null>(null)
  const [correction, setCorrection] = useState(false)
  const pageSize = 20

  // Filtres de recherche sur l'historique (distincts des champs d'export ci-dessous : ici on
  // réduit la table paginée affichée, l'export porte toujours sur sa propre période choisie).
  const [filtreEmployeId, setFiltreEmployeId] = useState('')
  const [filtreType, setFiltreType] = useState<'' | 'entree' | 'sortie'>('')
  const [filtreDebut, setFiltreDebut] = useState<Date | null>(null)
  const [filtreFin, setFiltreFin] = useState<Date | null>(null)
  const filtresActifs = Boolean(filtreEmployeId || filtreType || filtreDebut || filtreFin)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerPointages(
        {
          employeId: filtreEmployeId || undefined,
          typeScan: filtreType || undefined,
          debut: filtreDebut ? formatDate(filtreDebut, 'yyyy-MM-dd') : undefined,
          fin: filtreFin ? formatDate(filtreFin, 'yyyy-MM-dd') : undefined,
        },
        page,
        pageSize,
      )
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      void toast.error('Erreur au chargement des pointages')
    } finally {
      setLoading(false)
    }
  }, [page, filtreEmployeId, filtreType, filtreDebut, filtreFin])

  function reinitialiserFiltres() {
    setFiltreEmployeId('')
    setFiltreType('')
    setFiltreDebut(null)
    setFiltreFin(null)
    setPage(0)
  }

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

  async function confirmerCorrection(nouvelHorodatage: string, motif: string) {
    if (!pointageACorrige) return
    setCorrection(true)
    try {
      await corrigerPointage(pointageACorrige.id, nouvelHorodatage, motif)
      void toast.success('Pointage corrigé')
      setPointageACorrige(null)
      await charger()
    } catch {
      void toast.error('Échec de la correction du pointage')
    } finally {
      setCorrection(false)
    }
  }

  // Réutilise les filtres de la table (pas de nouvelle sélection à l'export) : Employé/Du/Au déjà
  // choisis ci-dessus, avec un repli sur "depuis le début du mois jusqu'à aujourd'hui" si aucune
  // période n'est filtrée (l'export exige toujours une période, contrairement à la table).
  async function lancerExport(fmt: 'xlsx' | 'pdf') {
    setShowExport(false)
    try {
      await exporterPresence(
        {
          employeId: filtreEmployeId || undefined,
          debut: formatDate(filtreDebut ?? debutDuMois(), 'yyyy-MM-dd'),
          fin: formatDate(filtreFin ?? new Date(), 'yyyy-MM-dd'),
        },
        fmt,
      )
    } catch {
      void toast.error("Échec de l'export")
    }
  }

  return (
    <div>
      {/* Filtres de recherche sur l'historique paginé ci-dessous, + export à droite (EF-EXP-02 :
          feuille de présence sur une période, distincte de l'historique paginé — l'export porte
          toujours sur l'ensemble filtré, jamais sur la page affichée). */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Employé</label>
          <select
            value={filtreEmployeId}
            onChange={(e) => {
              setFiltreEmployeId(e.target.value)
              setPage(0)
            }}
            className="h-9 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          >
            <option value="">Tous les employés</option>
            {optionsEmployes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Type</label>
          <select
            value={filtreType}
            onChange={(e) => {
              setFiltreType(e.target.value as '' | 'entree' | 'sortie')
              setPage(0)
            }}
            className="h-9 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          >
            <option value="">Entrée et sortie</option>
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Du</label>
          <DatePicker
            value={filtreDebut}
            onChange={(d) => {
              setFiltreDebut(d)
              setPage(0)
            }}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Au</label>
          <DatePicker
            value={filtreFin}
            onChange={(d) => {
              setFiltreFin(d)
              setPage(0)
            }}
          />
        </div>
        {filtresActifs && (
          <button
            type="button"
            onClick={reinitialiserFiltres}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            <RotateCcw size={13} /> Réinitialiser
          </button>
        )}

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowExport((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] bg-white px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            <Download size={13} /> Exporter la feuille de présence
          </button>
          {showExport && (
            <div className="absolute top-full right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
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
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">
            Aucun pointage {filtresActifs ? 'pour ces filtres' : ''}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Employé', 'Type', 'Horodatage', 'Correction', ...(estAdmin ? [''] : [])].map(
                  (h, i) => (
                    <th
                      key={h || `action-${i}`}
                      className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ),
                )}
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
                  <td className={estAdmin ? 'py-3.5 pr-4 pl-4' : 'py-3.5 pr-5'}>
                    {p.corrigeManuellement ? (
                      <MotifCorrectionBadge motif={p.motifCorrection} />
                    ) : (
                      <span className="text-[12px] text-[#9CA3AF]">Original</span>
                    )}
                  </td>
                  {estAdmin && (
                    <td className="py-3.5 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => setPointageACorrige(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D8D4CC] px-2.5 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                      >
                        <Pencil size={12} /> Corriger
                      </button>
                    </td>
                  )}
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

      <CorrigerPointageDialog
        pointage={pointageACorrige}
        onCancel={() => setPointageACorrige(null)}
        onConfirm={confirmerCorrection}
        submitting={correction}
      />
    </div>
  )
}
