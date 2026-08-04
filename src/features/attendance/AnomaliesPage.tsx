import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import type { ApiError } from '@/lib/apiClient'
import { useAuth } from '@/lib/AuthContext'
import { StatusTag } from '@/components/ui/StatusTag'
import {
  listerAnomalies,
  modifierPolitiqueAnomalies,
  obtenirPolitiqueAnomalies,
  resoudreAnomalie,
  type AnomaliePointageReponse,
  type PolitiqueAnomaliesReponse,
  type RepartitionTypeAnomalieReponse,
} from './api'
import { listerEmployes } from '../employee/employesApi'

const TYPES_LABELS: Record<string, string> = {
  retard: 'Retard',
  depart_anticipe: 'Départ anticipé',
  absence_checkout: 'Absence de check-out',
  presence_incomplete: 'Présence incomplète',
}

type TypeAnomalie = RepartitionTypeAnomalieReponse['type']

const CLE_POLITIQUE_ANOMALIES = ['politique-anomalies'] as const

function PolitiqueAnomaliesForm({ politique }: { politique: PolitiqueAnomaliesReponse }) {
  const queryClient = useQueryClient()
  const [ouvert, setOuvert] = useState(false)
  const [seuil, setSeuil] = useState(String(politique.seuilAnomalies))
  const [periode, setPeriode] = useState(String(politique.periodeJours))

  const mutation = useMutation({
    mutationFn: () =>
      modifierPolitiqueAnomalies({
        seuilAnomalies: Number(seuil),
        periodeJours: Number(periode),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_POLITIQUE_ANOMALIES })
      toast.success("Seuil d'alerte mis à jour.")
      setOuvert(false)
    },
    onError: (err: ApiError) => toast.error(err.message),
  })

  const modifie =
    Number(seuil) !== politique.seuilAnomalies || Number(periode) !== politique.periodeJours

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] bg-white px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
      >
        <SlidersHorizontal size={13} /> Seuil d'anomalies non résolues ({politique.seuilAnomalies} /{' '}
        {politique.periodeJours} j)
      </button>
      {ouvert && (
        <div className="absolute top-full right-0 z-10 mt-1 w-[280px] rounded-xl border border-[#D8D4CC] bg-white p-4 shadow-lg">
          <label className="mb-3 block">
            <span className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
              Seuil d'anomalies non résolues
            </span>
            <input
              type="number"
              min="1"
              value={seuil}
              onChange={(e) => setSeuil(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 text-[13px]"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
              Sur une période de (jours)
            </span>
            <input
              type="number"
              min="1"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 text-[13px]"
            />
          </label>
          <p className="mb-3 text-[11px] text-[#6B7280]">
            Au-delà de ce seuil, le Manager du département de l'employé est notifié automatiquement.
          </p>
          <Button
            variant="primary"
            disabled={!modifie}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full"
          >
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  )
}

function PolitiqueAnomaliesSection() {
  const { data: politique, isLoading } = useQuery({
    queryKey: CLE_POLITIQUE_ANOMALIES,
    queryFn: obtenirPolitiqueAnomalies,
  })

  if (isLoading || !politique) {
    return null
  }

  // key incluant modifieLe : force un remount après un enregistrement réussi, plutôt qu'un
  // useEffect qui recopierait la prop dans le state (react-hooks/set-state-in-effect).
  return <PolitiqueAnomaliesForm key={politique.modifieLe ?? 'defaut'} politique={politique} />
}

export function AnomaliesPage() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const [data, setData] = useState<AnomaliePointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [employes, setEmployes] = useState<Record<string, string>>({})
  const [optionsEmployes, setOptionsEmployes] = useState<{ id: string; nom: string }[]>([])
  const [filtreResolue, setFiltreResolue] = useState<boolean | undefined>(false)
  const [filtreEmployeId, setFiltreEmployeId] = useState('')
  const [filtreType, setFiltreType] = useState<'' | TypeAnomalie>('')
  const [filtreDebut, setFiltreDebut] = useState<Date | null>(null)
  const [filtreFin, setFiltreFin] = useState<Date | null>(null)
  const pageSize = 20

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerAnomalies(
        {
          resolue: filtreResolue,
          employeId: filtreEmployeId || undefined,
          type: filtreType || undefined,
          debut: filtreDebut ? dayjs(filtreDebut).format('YYYY-MM-DD') : undefined,
          fin: filtreFin ? dayjs(filtreFin).format('YYYY-MM-DD') : undefined,
        },
        page,
        pageSize,
      )
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      void toast.error('Erreur au chargement des anomalies')
    } finally {
      setLoading(false)
    }
  }, [page, filtreResolue, filtreEmployeId, filtreType, filtreDebut, filtreFin])

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

  function reinitialiserFiltres() {
    setFiltreEmployeId('')
    setFiltreType('')
    setFiltreDebut(null)
    setFiltreFin(null)
    setPage(0)
  }

  const filtresAvancesActifs = Boolean(filtreEmployeId || filtreType || filtreDebut || filtreFin)

  async function handleResoudre(anomalieId: string) {
    try {
      await resoudreAnomalie(anomalieId)
      void toast.success('Anomalie marquée comme résolue')
      void charger()
    } catch {
      void toast.error('Erreur lors de la résolution')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Statut</label>
          <select
            value={filtreResolue === undefined ? 'all' : filtreResolue ? 'true' : 'false'}
            onChange={(e) => {
              setPage(0)
              const v = e.target.value
              setFiltreResolue(v === 'all' ? undefined : v === 'true')
            }}
            className="h-9 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          >
            <option value="all">Toutes</option>
            <option value="false">Non résolues</option>
            <option value="true">Résolues</option>
          </select>
        </div>
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
        <div className="min-w-[170px]">
          <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">
            Type d'anomalie
          </label>
          <select
            value={filtreType}
            onChange={(e) => {
              setFiltreType(e.target.value as '' | TypeAnomalie)
              setPage(0)
            }}
            className="h-9 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPES_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
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
        {filtresAvancesActifs && (
          <button
            type="button"
            onClick={reinitialiserFiltres}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
          >
            <RotateCcw size={13} /> Réinitialiser
          </button>
        )}

        {estAdmin && <PolitiqueAnomaliesSection />}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {loading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : data.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">
            Aucune anomalie {filtresAvancesActifs ? 'pour ces filtres' : ''}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {[
                  'Employé',
                  'Date',
                  'Type',
                  'Statut',
                  'Créé le',
                  ...(estAdmin ? ['Action'] : []),
                ].map((h) => (
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
              {data.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="py-3.5 pr-4 pl-5 text-[13px] text-[#1B2A41]">
                    {employes[a.employeId] ?? `${a.employeId.substring(0, 8)}…`}
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {dayjs(a.datePointage).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={TYPES_LABELS[a.typeAnomalie] ?? a.typeAnomalie} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={a.resolue ? 'Actif' : 'En attente'} />
                    <span className="ml-1 text-[11px] text-[#6B7280]">
                      {a.resolue ? 'Résolue' : 'Non résolue'}
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[11px] text-[#9CA3AF]"
                  >
                    {dayjs(a.creeLe).format('DD/MM/YYYY HH:mm')}
                  </td>
                  {estAdmin && (
                    <td className="py-3.5 pr-5">
                      {!a.resolue && (
                        <button
                          onClick={() => void handleResoudre(a.id)}
                          className="text-[12px] text-[#4A7C6B] hover:underline"
                        >
                          Marquer résolue
                        </button>
                      )}
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
          <p className="text-[12px] text-[#9CA3AF]">{total} anomalies</p>
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
