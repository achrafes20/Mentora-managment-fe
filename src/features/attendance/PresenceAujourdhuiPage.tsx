import dayjs from 'dayjs'
import { CalendarDays, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { StatusTag } from '@/components/ui/StatusTag'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { obtenirPresenceAujourdhui, type PresenceAujourdhuiReponse } from './api'

type Statut = PresenceAujourdhuiReponse['statut']

const STATUTS_LABELS: Record<Statut, string> = {
  present: 'Présent',
  parti: 'Sorti',
  teletravail: 'Télétravail',
  conge: 'Congé',
  absent: 'Absent',
}

const STATUTS_COULEURS: Record<Statut, string> = {
  present: '#4A7C6B',
  parti: '#C87F3A',
  teletravail: '#C87F3A',
  conge: '#C87F3A',
  absent: '#C1495A',
}

const STATUTS_OPTIONS = Object.entries(STATUTS_LABELS) as [Statut, string][]

function heure(iso?: string) {
  return iso ? dayjs(iso).format('HH:mm') : '—'
}

function majuscule(texte: string) {
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

export function PresenceAujourdhuiPage() {
  const navigate = useNavigate()
  const [rechercheNom, setRechercheNom] = useState('')
  const [statutFiltre, setStatutFiltre] = useState<Statut | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['presence-aujourdhui'],
    queryFn: obtenirPresenceAujourdhui,
    refetchInterval: 60_000,
  })

  const comptes = useMemo(() => {
    const base: Record<Statut, number> = {
      present: 0,
      parti: 0,
      teletravail: 0,
      conge: 0,
      absent: 0,
    }
    for (const p of data ?? []) base[p.statut]++
    return base
  }, [data])

  const filtres = useMemo(() => {
    const recherche = rechercheNom.trim().toLowerCase()
    return (data ?? []).filter((p) => {
      if (statutFiltre && p.statut !== statutFiltre) return false
      if (recherche && !p.nomComplet.toLowerCase().includes(recherche)) return false
      return true
    })
  }, [data, rechercheNom, statutFiltre])

  const { trie, tri, handleTri } = useTriLocal(
    filtres,
    (p, champ) => p[champ as keyof PresenceAujourdhuiReponse] as string | number | null | undefined,
    { champ: 'nomComplet', direction: 'asc' },
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#1B2A41]">
          <CalendarDays size={15} className="text-[#9CA3AF]" />
          {majuscule(dayjs().format('dddd D MMMM YYYY'))}
        </div>

        <div className="flex flex-1 flex-wrap justify-end gap-3">
          {STATUTS_OPTIONS.map(([valeur, label]) => (
            <button
              key={valeur}
              onClick={() => setStatutFiltre((v) => (v === valeur ? '' : valeur))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-left transition-colors sm:flex-none ${
                statutFiltre === valeur
                  ? 'border-[#1B2A41]'
                  : 'border-[#D8D4CC] hover:border-[#1B2A41]/40'
              }`}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: STATUTS_COULEURS[valeur] }}
              />
              <span
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-[18px] font-semibold text-[#1B2A41]"
              >
                {comptes[valeur]}
              </span>
              <span className="text-[11px] text-[#6B7280]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Employé</label>
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                value={rechercheNom}
                onChange={(e) => setRechercheNom(e.target.value)}
                placeholder="Rechercher un nom…"
                className="rounded-lg border border-[#D8D4CC] bg-white py-1.5 pr-3 pl-7 text-[12px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Statut</label>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value as Statut | '')}
              className="rounded-lg border border-[#D8D4CC] bg-white px-3 py-1.5 text-[12px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
            >
              <option value="">Tous</option>
              {STATUTS_OPTIONS.map(([valeur, label]) => (
                <option key={valeur} value={valeur}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {(rechercheNom || statutFiltre) && (
            <button
              onClick={() => {
                setRechercheNom('')
                setStatutFiltre('')
              }}
              className="pb-1.5 text-[11px] text-[#9CA3AF] hover:text-[#1B2A41]"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <p className="pb-1.5 text-[11px] text-[#9CA3AF]">
          {trie.length} / {data?.length ?? 0} employé(s)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                <SortableTh label="Employé" champ="nomComplet" tri={tri} onChange={handleTri} />
                <SortableTh label="Statut" champ="statut" tri={tri} onChange={handleTri} />
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Entrée
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Sortie
                </th>
              </tr>
            </thead>
            <tbody>
              {trie.map((p) => (
                <tr
                  key={p.employeId}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="px-4 py-3.5 text-[13px]">
                    <button
                      onClick={() => navigate(`/employes/${p.employeId}`)}
                      className="text-left font-medium text-[#1B2A41] hover:text-[#C92B6A] hover:underline"
                    >
                      {p.nomComplet}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={STATUTS_LABELS[p.statut]} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {heure(p.heureEntree)}
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {heure(p.heureSortie)}
                  </td>
                </tr>
              ))}
              {trie.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                    {(data ?? []).length === 0
                      ? 'Aucun employé dans le périmètre.'
                      : 'Aucun résultat pour ces filtres.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
