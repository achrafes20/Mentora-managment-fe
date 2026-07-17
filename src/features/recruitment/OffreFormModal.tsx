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
import type { Departement } from '@/features/employee/api'
import type { OffreEmploi } from './recruitmentApi'

const schema = z.object({
  intitule: z.string().min(1, "L'intitulé est requis").max(200, '200 caractères maximum'),
  description: z.string(),
  departementId: z.string().min(1, 'Le département est requis'),
  motsClesRequis: z.string(),
})

export type OffreFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  offre?: OffreEmploi | null
  departements: Departement[]
  onCancel: () => void
  onSubmit: (values: OffreFormValues) => void
  submitting: boolean
  errorMessage?: string | null
}

export function OffreFormModal({
  open,
  offre,
  departements,
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
  } = useForm<OffreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { intitule: '', description: '', departementId: '', motsClesRequis: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        intitule: offre?.intitule ?? '',
        description: offre?.description ?? '',
        departementId: offre?.departementId ?? '',
        motsClesRequis: (offre?.motsClesRequis ?? []).join(', '),
      })
    }
  }, [open, offre, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title={offre ? "Modifier l'offre" : 'Nouvelle offre'}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={submitting} onClick={handleSubmit(onSubmit)}>
            {offre ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      {errorMessage && <Alert message={errorMessage} />}
      <FormField label="Intitulé du poste" required error={errors.intitule?.message}>
        <Controller
          name="intitule"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Ex. Développeur Full Stack" />}
        />
      </FormField>
      <FormField label="Département" required error={errors.departementId?.message}>
        <Controller
          name="departementId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={departements.map((d) => ({ label: d.nom ?? '', value: d.id ?? '' }))}
            />
          )}
        />
      </FormField>
      <FormField label="Description">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={4}
              className="w-full rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
            />
          )}
        />
      </FormField>
      <FormField
        label="Mots-clés requis"
        hint="Séparés par des virgules — utilisés pour le matching IA et la réactivation automatique des candidatures en attente (EF-REC-12)."
      >
        <Controller
          name="motsClesRequis"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Java, Spring, PostgreSQL" />}
        />
      </FormField>
    </Dialog>
  )
}
