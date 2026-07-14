import { Modal, message } from 'antd'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  creerPlanningTeletravail,
  listerPlanningsTeletravail,
  supprimerPlanningTeletravail,
  type PlanningTeletravailReponse,
} from './api'

const JOURS_SEMAINE = [
  { label: 'Lun', value: 'lundi' },
  { label: 'Mar', value: 'mardi' },
  { label: 'Mer', value: 'mercredi' },
  { label: 'Jeu', value: 'jeudi' },
  { label: 'Ven', value: 'vendredi' },
]

const JOURS_LABELS: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
}

interface Props {
  employeId: string
  estAdmin: boolean
}

export function EmployeTeletravailCard({ employeId, estAdmin }: Props) {
  const [plannings, setPlannings] = useState<PlanningTeletravailReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [ajoutVisible, setAjoutVisible] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [joursChoisis, setJoursChoisis] = useState<string[]>([])

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerPlanningsTeletravail(employeId)
      setPlannings(res)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [employeId])

  useEffect(() => {
    charger()
  }, [charger])

  async function handleCreer() {
    if (!dateDebut || joursChoisis.length === 0) {
      void message.warning('Date de début et au moins un jour requis')
      return
    }
    try {
      await creerPlanningTeletravail(employeId, {
        dateDebut,
        dateFin: dateFin || undefined,
        jours: joursChoisis,
      })
      void message.success('Planning créé')
      setAjoutVisible(false)
      setDateDebut('')
      setDateFin('')
      setJoursChoisis([])
      charger()
    } catch {
      void message.error('Erreur lors de la création')
    }
  }

  function toggleJour(jour: string) {
    setJoursChoisis((prev) =>
      prev.includes(jour) ? prev.filter((j) => j !== jour) : [...prev, jour],
    )
  }

  return (
    <div className="rounded-xl border border-[#D8D4CC] bg-white">
      <div className="flex items-center justify-between border-b border-[#D8D4CC] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#6B7280]" />
          <p className="text-[12px] font-medium text-[#1B2A41]">Planning télétravail</p>
        </div>
        {estAdmin && !ajoutVisible && (
          <button
            onClick={() => setAjoutVisible(true)}
            className="flex items-center gap-1 rounded-lg border border-[#D8D4CC] px-2.5 py-1 text-[11px] text-[#1B2A41] hover:border-[#1B2A41]"
          >
            <Plus size={11} /> Ajouter
          </button>
        )}
      </div>

      <div className="p-5">
        {ajoutVisible && estAdmin && (
          <div className="mb-4 space-y-3 rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                  Date début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                  Date fin (opt.)
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {JOURS_SEMAINE.map((j) => (
                <button
                  key={j.value}
                  type="button"
                  onClick={() => toggleJour(j.value)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    joursChoisis.includes(j.value)
                      ? 'bg-[#1B2A41] text-white'
                      : 'border border-[#D8D4CC] text-[#6B7280] hover:border-[#1B2A41]'
                  }`}
                >
                  {j.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleCreer()}
                className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#243650]"
              >
                Valider
              </button>
              <button
                onClick={() => setAjoutVisible(false)}
                className="rounded-lg border border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="py-4 text-center text-[12px] text-[#9CA3AF]">Chargement…</p>
        ) : plannings.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-[#9CA3AF]">
            Aucun planning de télétravail
          </p>
        ) : (
          <div className="space-y-2">
            {plannings.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[#D8D4CC]/60 px-4 py-3"
              >
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="text-[12px] text-[#1B2A41]"
                  >
                    {dayjs(p.dateDebut).format('DD/MM/YYYY')} →{' '}
                    {p.dateFin ? dayjs(p.dateFin).format('DD/MM/YYYY') : 'Indéfini'}
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    {p.jours.map((j) => (
                      <span
                        key={j}
                        className="rounded bg-[#1B2A41]/8 px-1.5 py-0.5 text-[10px] text-[#1B2A41]"
                      >
                        {JOURS_LABELS[j] ?? j}
                      </span>
                    ))}
                  </div>
                </div>
                {estAdmin && (
                  <button
                    onClick={() => {
                      Modal.confirm({
                        title: 'Supprimer ce planning ?',
                        okText: 'Supprimer',
                        cancelText: 'Annuler',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await supprimerPlanningTeletravail(employeId, p.id)
                            void message.success('Planning supprimé')
                            charger()
                          } catch {
                            void message.error('Erreur lors de la suppression')
                          }
                        },
                      })
                    }}
                    className="rounded p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#C1495A]/8 hover:text-[#C1495A]"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
