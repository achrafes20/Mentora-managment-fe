import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Form as AntForm, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Departement } from './api'
import { libelleManager, type Manager } from './useManagers'

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
    <Modal
      title={depart ? 'Modifier le département' : 'Nouveau département'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={submitting}
      okText={depart ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      destroyOnClose
    >
      {errorMessage && (
        <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />
      )}
      <AntForm layout="vertical">
        <AntForm.Item
          label="Nom du département"
          validateStatus={errors.nom ? 'error' : ''}
          help={errors.nom?.message}
          required
        >
          <Controller
            name="nom"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Ex. Ressources Humaines" />}
          />
        </AntForm.Item>
        <AntForm.Item
          label="Manager rattaché"
          validateStatus={errors.managerId ? 'error' : ''}
          help={errors.managerId?.message}
        >
          <Controller
            name="managerId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                allowClear
                placeholder="Aucun (optionnel)"
                options={managers.map((m) => ({ label: libelleManager(m), value: m.id }))}
              />
            )}
          />
        </AntForm.Item>
      </AntForm>
    </Modal>
  )
}
