import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { useAuth } from '@/lib/AuthContext'
import { creerHoraireReference, listerHorairesReference, type HoraireReferenceReponse } from './api'

export function HorairesReferencePage() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const [data, setData] = useState<HoraireReferenceReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [heureDebutMatin, setHeureDebutMatin] = useState('08:30')
  const [heureFinMatin, setHeureFinMatin] = useState('13:00')
  const [heureDebutApresMidi, setHeureDebutApresMidi] = useState('14:00')
  const [heureFinApresMidi, setHeureFinApresMidi] = useState('17:00')
  const [toleranceMinutes, setToleranceMinutes] = useState(10)
  const [dateEffet, setDateEffet] = useState(dayjs().format('YYYY-MM-DD'))

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listerHorairesReference())
    } catch {
      void message.error('Erreur au chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  async function handleCreer(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await creerHoraireReference({
        heureDebutMatin: `${heureDebutMatin}:00`,
        heureFinMatin: `${heureFinMatin}:00`,
        heureDebutApresMidi: `${heureDebutApresMidi}:00`,
        heureFinApresMidi: `${heureFinApresMidi}:00`,
        toleranceMinutes,
        dateEffet,
      })
      void message.success('Horaire de référence enregistré')
      void charger()
    } catch {
      void message.error('Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {estAdmin && (
        <form
          onSubmit={(e) => void handleCreer(e)}
          className="rounded-xl border border-[#D8D4CC] bg-white p-5"
        >
          <p className="mb-4 text-[13px] font-semibold text-[#1B2A41]">
            Nouvel horaire de référence
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { label: 'Début matin', value: heureDebutMatin, set: setHeureDebutMatin },
              { label: 'Fin matin', value: heureFinMatin, set: setHeureFinMatin },
              {
                label: 'Début après-midi',
                value: heureDebutApresMidi,
                set: setHeureDebutApresMidi,
              },
              { label: 'Fin après-midi', value: heureFinApresMidi, set: setHeureFinApresMidi },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-[11px] font-medium text-[#1B2A41]">{label}</label>
                <input
                  type="time"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-medium text-[#1B2A41]">Tolérance (min)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={toleranceMinutes}
                onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                required
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#1B2A41]">Date d'effet</label>
              <input
                type="date"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] focus:border-[#1B2A41] focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#9CA3AF]">
            Ce changement s'applique uniquement aux pointages futurs. Les pointages passés restent
            évalués selon l'horaire en vigueur à leur date.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#243650] disabled:opacity-50"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}

      <div>
        <p className="mb-3 text-[12px] font-semibold text-[#1B2A41]">Historique des versions</p>
        <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
          {loading ? (
            <p className="p-6 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
          ) : data.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-[#9CA3AF]">Aucun horaire enregistré</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                  {["Date d'effet", 'Matin', 'Après-midi', 'Tolérance'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[#D8D4CC]/50 last:border-0 hover:bg-[#F7F7F4]"
                  >
                    <td
                      style={{ fontFamily: 'var(--font-code)' }}
                      className="pl-5 pr-4 py-3.5 text-[13px] text-[#1B2A41]"
                    >
                      {dayjs(h.dateEffet).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {h.heureDebutMatin?.slice(0, 5)} – {h.heureFinMatin?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {h.heureDebutApresMidi?.slice(0, 5)} – {h.heureFinApresMidi?.slice(0, 5)}
                    </td>
                    <td
                      style={{ fontFamily: 'var(--font-code)' }}
                      className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                    >
                      {h.toleranceMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
