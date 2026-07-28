import { useState } from 'react'
import dayjs from 'dayjs'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import type { PointageReponse } from './api'

const HEURES = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, m) => m.toString().padStart(2, '0'))

interface Props {
  pointage: PointageReponse | null
  onCancel: () => void
  onConfirm: (nouvelHorodatage: string, motif: string) => void
  submitting: boolean
}

/**
 * EF-ATT-06 : correction manuelle d'un pointage par un Admin (cas d'oubli de scan), avec motif
 * obligatoire — traçabilité exigée côté backend (@NotBlank + événement d'audit NFR-SEC-03).
 */
export function CorrigerPointageDialog({ pointage, onCancel, onConfirm, submitting }: Props) {
  const [date, setDate] = useState<Date | null>(null)
  const [heure, setHeure] = useState('08:30')
  const [motif, setMotif] = useState('')
  // Réinitialise à l'ouverture (nouveau pointage ciblé) — ajustement pendant le rendu, même
  // pattern que EntretienScheduleDialog, pas un effet.
  const [pointageOuvert, setPointageOuvert] = useState<string | null>(null)
  if ((pointage?.id ?? null) !== pointageOuvert) {
    setPointageOuvert(pointage?.id ?? null)
    if (pointage) {
      const d = dayjs(pointage.horodatage)
      setDate(d.toDate())
      setHeure(d.format('HH:mm'))
      setMotif('')
    }
  }

  function confirmer() {
    if (!date) return
    const [h, m] = heure.split(':').map(Number)
    const combine = dayjs(date).hour(h).minute(m).second(0).millisecond(0)
    onConfirm(combine.toISOString(), motif.trim())
  }

  const motifValide = motif.trim().length > 0

  return (
    <Dialog
      open={pointage !== null}
      onOpenChange={(o) => !o && onCancel()}
      title="Corriger le pointage"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={submitting} disabled={!date || !motifValide} onClick={confirmer}>
            Confirmer la correction
          </Button>
        </>
      }
    >
      <FormField label="Nouvelle date" required>
        <DatePicker value={date} onChange={setDate} />
      </FormField>
      <FormField label="Nouvelle heure" required>
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
      <FormField
        label="Motif"
        required
        error={!motifValide && motif.length > 0 ? 'Le motif est obligatoire' : undefined}
        hint="Ex. : oubli de scan à l'arrivée — visible dans l'historique et le journal d'audit."
      >
        <Input
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="Raison de la correction"
        />
      </FormField>
    </Dialog>
  )
}
