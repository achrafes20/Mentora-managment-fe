import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
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
} from './api'
import { listerEmployes } from '../employee/employesApi'

const TYPES_LABELS: Record<string, string> = {
  retard: 'Retard',
  depart_anticipe: 'Départ anticipé',
  absence_checkout: 'Absence de check-out',
  presence_incomplete: 'Présence incomplète',
}

const CLE_POLITIQUE_ANOMALIES = ['politique-anomalies'] as const

function PolitiqueAnomaliesForm({ politique }: { politique: PolitiqueAnomaliesReponse }) {
  const queryClient = useQueryClient()
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
    },
    onError: (err: ApiError) => toast.error(err.message),
  })

  const modifie =
    Number(seuil) !== politique.seuilAnomalies || Number(periode) !== politique.periodeJours

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-[#D8D4CC] bg-white p-4">
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
          Seuil d'anomalies non résolues
        </span>
        <input
          type="number"
          min="1"
          value={seuil}
          onChange={(e) => setSeuil(e.target.value)}
          className="w-24 rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-1.5 text-[13px]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
          Sur une période de (jours)
        </span>
        <input
          type="number"
          min="1"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="w-24 rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-1.5 text-[13px]"
        />
      </label>
      <Button
        variant="primary"
        disabled={!modifie}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Enregistrer
      </Button>
      <p className="basis-full text-[11px] text-[#6B7280]">
        Au-delà de ce seuil, le Manager du département de l'employé est notifié automatiquement.
      </p>
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
  const [filtreResolue, setFiltreResolue] = useState<boolean | undefined>(false)
  const pageSize = 20

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerAnomalies(filtreResolue, page, pageSize)
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      void toast.error('Erreur au chargement des anomalies')
    } finally {
      setLoading(false)
    }
  }, [page, filtreResolue])

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
      {estAdmin && <PolitiqueAnomaliesSection />}

      <div className="mb-4 flex items-center gap-3">
        <span className="text-[12px] text-[#6B7280]">Filtre :</span>
        <select
          value={filtreResolue === undefined ? 'all' : filtreResolue ? 'true' : 'false'}
          onChange={(e) => {
            setPage(0)
            const v = e.target.value
            setFiltreResolue(v === 'all' ? undefined : v === 'true')
          }}
          className="rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280] focus:border-[#1B2A41] focus:outline-none"
        >
          <option value="all">Toutes</option>
          <option value="false">Non résolues</option>
          <option value="true">Résolues</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {loading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : data.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Aucune anomalie</p>
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
