import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, DatePicker, Form as AntForm, Input, Modal, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { Controller, type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Avatar } from '@/components/ui/Avatar'
import { useEmployePhotoUrl } from './useEmployePhoto'
import type { Departement } from './api'
import type { Employe } from './employesApi'
import { libelleManager, type Manager } from './useManagers'

const TYPES_CONTRAT = ['CDI', 'CDD', 'STAGIAIRE', 'STAGIAIRE_REMUNERE'] as const

const schema = z
  .object({
    nom: z.string().min(1, 'Le nom est requis').max(100),
    prenom: z.string().min(1, 'Le prénom est requis').max(100),
    email: z.union([z.string().email('E-mail invalide'), z.literal('')]),
    telephone: z.string(),
    poste: z.string(),
    departementId: z.string().min(1, 'Le département est requis'),
    managerId: z.union([z.string().uuid('UUID manager invalide'), z.literal('')]),
    dateEmbauche: z.instanceof(dayjs as unknown as new (...args: never[]) => Dayjs, {
      message: "La date d'embauche est requise",
    }),
    typeContrat: z.enum(TYPES_CONTRAT),
    dateFinContratPrevue: z
      .instanceof(dayjs as unknown as new (...args: never[]) => Dayjs)
      .nullable(),
  })
  .refine((valeurs) => valeurs.typeContrat === 'CDD' || !valeurs.dateFinContratPrevue, {
    message: "La date de fin de contrat prévue n'est applicable qu'aux CDD",
    path: ['dateFinContratPrevue'],
  })

export type EmployeFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  mode: 'creation' | 'edition'
  employe?: Employe | null
  departements: Departement[]
  managers: Manager[]
  onCancel: () => void
  onSubmit: (values: EmployeFormValues, photo?: File | null) => void
  submitting: boolean
  errorMessage?: string | null
}

export function EmployeFormModal({
  open,
  mode,
  employe,
  departements,
  managers,
  onCancel,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoExistante = useEmployePhotoUrl(
    mode === 'edition' ? employe?.id : undefined,
    mode === 'edition' ? employe?.photoFichierId : undefined,
  )

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EmployeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      poste: '',
      departementId: '',
      managerId: '',
      dateEmbauche: dayjs(),
      typeContrat: 'CDI',
      dateFinContratPrevue: null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        nom: employe?.nom ?? '',
        prenom: employe?.prenom ?? '',
        email: employe?.email ?? '',
        telephone: employe?.telephone ?? '',
        poste: employe?.poste ?? '',
        departementId: employe?.departementId ?? '',
        managerId: employe?.managerId ?? '',
        dateEmbauche: employe?.dateEmbauche ? dayjs(employe.dateEmbauche) : dayjs(),
        typeContrat: (employe?.typeContrat as (typeof TYPES_CONTRAT)[number]) ?? 'CDI',
        dateFinContratPrevue: employe?.dateFinContratPrevue
          ? dayjs(employe.dateFinContratPrevue)
          : null,
      })
      setPhoto(null)
      setPhotoPreview(null)
    }
  }, [open, employe, reset])

  const typeContratActuel = watch('typeContrat')
  const prenomActuel = watch('prenom')
  const nomActuel = watch('nom')
  const apercuPhoto = photoPreview ?? photoExistante

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    if (!['image/jpeg', 'image/png'].includes(fichier.type)) return
    setPhoto(fichier)
    setPhotoPreview(URL.createObjectURL(fichier))
  }

  return (
    <Modal
      title={mode === 'creation' ? 'Nouvel employé' : "Modifier l'employé"}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit((values) => onSubmit(values, photo))}
      confirmLoading={submitting}
      okText={mode === 'creation' ? 'Créer' : 'Enregistrer'}
      cancelText="Annuler"
      destroyOnClose
      width={600}
      okButtonProps={{ style: { color: '#fff' } }}
    >
      {errorMessage && (
        <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />
      )}
      <AntForm layout="vertical">
        <AntForm.Item label="Photo (optionnelle)">
          <div className="flex items-center gap-4">
            <Avatar
              prenom={prenomActuel || employe?.prenom || ''}
              nom={nomActuel || employe?.nom || ''}
              size="md"
              photoUrl={apercuPhoto}
            />
            <label className="cursor-pointer rounded-lg border border-dashed border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
              Choisir une photo
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">JPEG ou PNG, max 10 Mo</p>
        </AntForm.Item>
        <AntForm.Item
          label="Nom"
          validateStatus={errors.nom ? 'error' : ''}
          help={errors.nom?.message}
          required
        >
          <Controller name="nom" control={control} render={({ field }) => <Input {...field} />} />
        </AntForm.Item>
        <AntForm.Item
          label="Prénom"
          validateStatus={errors.prenom ? 'error' : ''}
          help={errors.prenom?.message}
          required
        >
          <Controller
            name="prenom"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </AntForm.Item>
        <AntForm.Item
          label="E-mail"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller name="email" control={control} render={({ field }) => <Input {...field} />} />
        </AntForm.Item>
        <AntForm.Item label="Téléphone">
          <Controller
            name="telephone"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </AntForm.Item>
        <AntForm.Item label="Poste">
          <Controller name="poste" control={control} render={({ field }) => <Input {...field} />} />
        </AntForm.Item>
        {mode === 'creation' && (
          <>
            <AntForm.Item
              label="Département"
              validateStatus={errors.departementId ? 'error' : ''}
              help={errors.departementId?.message}
              required
            >
              <Controller
                name="departementId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={departements.map((d) => ({ label: d.nom, value: d.id }))}
                  />
                )}
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
          </>
        )}
        <AntForm.Item
          label="Date d'embauche"
          validateStatus={errors.dateEmbauche ? 'error' : ''}
          help={(errors.dateEmbauche as FieldError | undefined)?.message}
          required
        >
          <Controller
            name="dateEmbauche"
            control={control}
            render={({ field }) => (
              <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />
            )}
          />
        </AntForm.Item>
        <AntForm.Item label="Type de contrat" required>
          <Controller
            name="typeContrat"
            control={control}
            render={({ field }) => (
              <Select {...field} options={TYPES_CONTRAT.map((t) => ({ label: t, value: t }))} />
            )}
          />
        </AntForm.Item>
        <AntForm.Item
          label="Date de fin de contrat prévue (CDD uniquement)"
          validateStatus={errors.dateFinContratPrevue ? 'error' : ''}
          help={(errors.dateFinContratPrevue as FieldError | undefined)?.message}
        >
          <Controller
            name="dateFinContratPrevue"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                disabled={typeContratActuel !== 'CDD'}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            )}
          />
        </AntForm.Item>
      </AntForm>
    </Modal>
  )
}
