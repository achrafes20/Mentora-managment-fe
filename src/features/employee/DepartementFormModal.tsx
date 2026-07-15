import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import type { Departement } from './api'
import { libelleManager, type Manager } from './useManagers'

const AUCUN_MANAGER = '__aucun__'

const schema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(150, '150 caractères maximum'),
  managerId: z.union([z.string().uuid('UUID manager invalide'), z.literal('')]),
})

export type DepartementFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  depart?: Departement | null
  managers: Manager[]
  onCancel: () => void
  onSubmit: (values: DepartementFormValues) => void
  submitting: boolean
  errorMessage?: string | null
}

export function DepartementFormModal({
  open,
  depart,
  managers,
  onCancel,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', managerId: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ nom: depart?.nom ?? '', managerId: depart?.managerId ?? '' })
    }
  }, [open, depart, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title={depart ? 'Modifier le département' : 'Nouveau département'}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={submitting} onClick={handleSubmit(onSubmit)}>
            {depart ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      {errorMessage && <Alert message={errorMessage} />}
      <FormField label="Nom du département" required error={errors.nom?.message}>
        <Controller
          name="nom"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Ex. Ressources Humaines" />}
        />
      </FormField>
      <FormField label="Manager rattaché" error={errors.managerId?.message}>
        <Controller
          name="managerId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || AUCUN_MANAGER}
              onChange={(v) => field.onChange(v === AUCUN_MANAGER ? '' : v)}
              onBlur={field.onBlur}
              placeholder="Aucun (optionnel)"
              options={[
                { value: AUCUN_MANAGER, label: 'Aucun (optionnel)' },
                ...managers.map((m) => ({ label: libelleManager(m), value: m.id })),
              ]}
            />
          )}
        />
      </FormField>
    </Dialog>
  )
}
