import { useState } from 'react'
import { format } from 'date-fns'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { useManagers, libelleManager } from '@/features/employee/useManagers'

const HEURES = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

interface Props {
  open: boolean
  title: string
  managerParDefaut?: string | null
  dateParDefaut?: string | null
  onCancel: () => void
  onConfirm: (managerId: string | undefined, dateEntretien: string | undefined) => void
  submitting: boolean
}

/**
 * EF-REC-08/09 : programmation (manager + date/heure) d'un entretien — utilisée à la fois pour la
 * transition initiale "Présélectionné -> Entretien" et pour la reprogrammation ultérieure.
 */
export function EntretienScheduleDialog({
  open,
  title,
  managerParDefaut,
  dateParDefaut,
  onCancel,
  onConfirm,
  submitting,
}: Props) {
  const { data: managers } = useManagers()
  const [managerId, setManagerId] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [heure, setHeure] = useState('09:00')
  // Réinitialise à l'ouverture — ajustement pendant le rendu (pattern recommandé par React pour
  // "reset state on prop change"), pas un effet, pour éviter les rendus en cascade.
  const [ouvertPrecedemment, setOuvertPrecedemment] = useState(open)
  if (open !== ouvertPrecedemment) {
    setOuvertPrecedemment(open)
    if (open) {
      setManagerId(managerParDefaut ?? '')
      const d = dateParDefaut ? new Date(dateParDefaut) : null
      setDate(d)
      setHeure(d ? format(d, 'HH:mm') : '09:00')
    }
  }

  function confirmer() {
    let dateEntretien: string | undefined
    if (date) {
      const [h, m] = heure.split(':').map(Number)
      const combinee = new Date(date)
      combinee.setHours(h, m, 0, 0)
      dateEntretien = combinee.toISOString()
    }
    onConfirm(managerId || undefined, dateEntretien)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={submitting} disabled={!managerId} onClick={confirmer}>
            Confirmer
          </Button>
        </>
      }
    >
      <FormField label="Manager assigné" required>
        <Select
          value={managerId}
          onChange={setManagerId}
          placeholder="Sélectionner un manager"
          options={(managers ?? []).map((m) => ({ label: libelleManager(m), value: m.id ?? '' }))}
        />
      </FormField>
      <FormField label="Date de l'entretien">
        <DatePicker value={date} onChange={setDate} />
      </FormField>
      <FormField label="Heure">
        <div className="flex items-center gap-2">
          <Select
            value={heure.split(':')[0]}
            onChange={(h) => setHeure(`${h}:${heure.split(':')[1]}`)}
            options={HEURES.map((h) => ({ label: h, value: h }))}
            className="w-[88px]"
          />
          <span className="text-[13px] font-medium text-[#9CA3AF]">:</span>
          <Select
            value={heure.split(':')[1]}
            onChange={(m) => setHeure(`${heure.split(':')[0]}:${m}`)}
            options={MINUTES.map((m) => ({ label: m, value: m }))}
            className="w-[88px]"
          />
        </div>
      </FormField>
    </Dialog>
  )
}
