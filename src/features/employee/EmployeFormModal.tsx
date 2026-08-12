import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { useEmployePhotoUrl } from './useEmployePhoto'
import type { Departement } from './api'
import type { Employe } from './employesApi'
import { libelleManager, type Manager } from './useManagers'

const TYPES_CONTRAT = ['CDI', 'CDD', 'STAGIAIRE', 'STAGIAIRE_REMUNERE'] as const
const AUCUN_MANAGER = '__aucun__'
// Optionnel (aucune valeur par défaut imposée aux fiches existantes, cf. V16) : accord de genre
// sur les certificats générés (document.CertificatGenerator) — "" dégrade vers "il/elle".
const SEXES = ['HOMME', 'FEMME'] as const
const SEXE_NON_RENSEIGNE = ''

const schema = z
  .object({
    nom: z.string().min(1, 'Le nom est requis').max(100),
    prenom: z.string().min(1, 'Le prénom est requis').max(100),
    email: z.union([z.string().email('E-mail invalide'), z.literal('')]),
    telephone: z.string(),
    poste: z.string(),
    departementId: z.string().min(1, 'Le département est requis'),
    managerId: z.union([z.string().uuid('UUID manager invalide'), z.literal('')]),
    dateEmbauche: z.date({ required_error: "La date d'embauche est requise" }),
    typeContrat: z.enum(TYPES_CONTRAT),
    dateFinContratPrevue: z.date().nullable(),
    dateFinStagePrevue: z.date().nullable(),
    sexe: z.union([z.enum(SEXES), z.literal(SEXE_NON_RENSEIGNE)]),
    cin: z.string(),
    sujetStage: z.string(),
    numeroCnss: z.string(),
    numeroAmo: z.string(),
    numeroCimr: z.string(),
    rib: z.string(),
    periodeEssaiFinLe: z.date().nullable(),
  })
  .refine((valeurs) => valeurs.typeContrat === 'CDD' || !valeurs.dateFinContratPrevue, {
    message: "La date de fin de contrat prévue n'est applicable qu'aux CDD",
    path: ['dateFinContratPrevue'],
  })
  .refine(
    (valeurs) =>
      valeurs.typeContrat === 'STAGIAIRE' ||
      valeurs.typeContrat === 'STAGIAIRE_REMUNERE' ||
      !valeurs.dateFinStagePrevue,
    {
      message: "La date de fin de stage prévue n'est applicable qu'aux stagiaires",
      path: ['dateFinStagePrevue'],
    },
  )
  .refine(
    (valeurs) =>
      !valeurs.dateFinContratPrevue || valeurs.dateFinContratPrevue >= valeurs.dateEmbauche,
    {
      message: "La date de fin de contrat prévue doit être postérieure à la date d'embauche",
      path: ['dateFinContratPrevue'],
    },
  )
  .refine(
    (valeurs) => !valeurs.dateFinStagePrevue || valeurs.dateFinStagePrevue >= valeurs.dateEmbauche,
    {
      message: "La date de fin de stage prévue doit être postérieure à la date d'embauche",
      path: ['dateFinStagePrevue'],
    },
  )

export type EmployeFormValues = z.infer<typeof schema>

/** Sous-ensemble des champs pré-remplissables depuis une candidature "Embauchée" (EF-EMP-05). */
export interface EmployePrefill {
  nom?: string | null
  prenom?: string | null
  email?: string | null
  telephone?: string | null
  poste?: string | null
}

interface Props {
  open: boolean
  mode: 'creation' | 'edition'
  employe?: Employe | null
  /** Uniquement en mode 'creation' — préremplit le formulaire depuis une candidature embauchée. */
  prefill?: EmployePrefill | null
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
  prefill,
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
    setValue,
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
      dateEmbauche: new Date(),
      typeContrat: 'CDI',
      dateFinContratPrevue: null,
      dateFinStagePrevue: null,
      sexe: SEXE_NON_RENSEIGNE,
      cin: '',
      sujetStage: '',
      numeroCnss: '',
      numeroAmo: '',
      numeroCimr: '',
      rib: '',
      periodeEssaiFinLe: null,
    },
  })

  useEffect(() => {
    if (open) {
      const source = mode === 'creation' ? prefill : employe
      reset({
        nom: source?.nom ?? '',
        prenom: source?.prenom ?? '',
        email: source?.email ?? '',
        telephone: source?.telephone ?? '',
        poste: source?.poste ?? '',
        departementId: employe?.departementId ?? '',
        managerId: employe?.managerId ?? '',
        dateEmbauche: employe?.dateEmbauche ? new Date(employe.dateEmbauche) : new Date(),
        typeContrat: (employe?.typeContrat as (typeof TYPES_CONTRAT)[number]) ?? 'CDI',
        dateFinContratPrevue: employe?.dateFinContratPrevue
          ? new Date(employe.dateFinContratPrevue)
          : null,
        dateFinStagePrevue: employe?.dateFinStagePrevue
          ? new Date(employe.dateFinStagePrevue)
          : null,
        sexe: (employe?.sexe as (typeof SEXES)[number]) ?? SEXE_NON_RENSEIGNE,
        cin: employe?.cin ?? '',
        sujetStage: employe?.sujetStage ?? '',
        numeroCnss: employe?.numeroCnss ?? '',
        numeroAmo: employe?.numeroAmo ?? '',
        numeroCimr: employe?.numeroCimr ?? '',
        rib: employe?.rib ?? '',
        periodeEssaiFinLe: employe?.periodeEssaiFinLe ? new Date(employe.periodeEssaiFinLe) : null,
      })
      setPhoto(null)
      setPhotoPreview(null)
    }
  }, [open, employe, prefill, mode, reset])

  const typeContratActuel = watch('typeContrat')
  const departementIdActuel = watch('departementId')
  const prenomActuel = watch('prenom')
  const nomActuel = watch('nom')
  const apercuPhoto = photoPreview ?? photoExistante

  // Un seul manager par département (Departement.managerId) : le champ reste modifiable, mais on
  // évite le clic redondant en le pré-remplissant dès que le département choisi en a un.
  useEffect(() => {
    if (mode !== 'creation') return
    const managerDuDepartement = departements.find((d) => d.id === departementIdActuel)?.managerId
    setValue('managerId', managerDuDepartement ?? '')
  }, [departementIdActuel, departements, mode, setValue])

  // Un seul des deux champs de fin est pertinent selon le type de contrat : on efface l'autre pour
  // qu'il ne reste pas une valeur fantôme rejetée par le schéma (refine ci-dessus) une fois masqué.
  useEffect(() => {
    if (typeContratActuel !== 'CDD') {
      setValue('dateFinContratPrevue', null)
    }
    if (typeContratActuel !== 'STAGIAIRE' && typeContratActuel !== 'STAGIAIRE_REMUNERE') {
      setValue('dateFinStagePrevue', null)
      setValue('sujetStage', '')
    }
  }, [typeContratActuel, setValue])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    if (!['image/jpeg', 'image/png'].includes(fichier.type)) return
    setPhoto(fichier)
    setPhotoPreview(URL.createObjectURL(fichier))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title={mode === 'creation' ? 'Nouvel employé' : "Modifier l'employé"}
      width={600}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={submitting} onClick={handleSubmit((values) => onSubmit(values, photo))}>
            {mode === 'creation' ? 'Créer' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <FormField label="Photo (optionnelle)">
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
      </FormField>
      <FormField label="Nom" required error={errors.nom?.message}>
        <Controller name="nom" control={control} render={({ field }) => <Input {...field} />} />
      </FormField>
      <FormField label="Prénom" required error={errors.prenom?.message}>
        <Controller name="prenom" control={control} render={({ field }) => <Input {...field} />} />
      </FormField>
      <FormField label="E-mail" error={errors.email?.message}>
        <Controller name="email" control={control} render={({ field }) => <Input {...field} />} />
      </FormField>
      <FormField label="Téléphone">
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </FormField>
      <FormField label="Poste">
        <Controller name="poste" control={control} render={({ field }) => <Input {...field} />} />
      </FormField>
      <FormField label="CIN">
        <Controller name="cin" control={control} render={({ field }) => <Input {...field} />} />
        <p className="mt-1 text-[11px] text-[#9CA3AF]">Affichée sur l'attestation de travail.</p>
      </FormField>
      <FormField label="Sexe">
        <Controller
          name="sexe"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || SEXE_NON_RENSEIGNE}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Non renseigné"
              options={[
                { value: SEXE_NON_RENSEIGNE, label: 'Non renseigné' },
                { value: 'HOMME', label: 'Homme' },
                { value: 'FEMME', label: 'Femme' },
              ]}
            />
          )}
        />
        <p className="mt-1 text-[11px] text-[#9CA3AF]">
          Utilisé pour l'accord de genre sur les certificats générés.
        </p>
      </FormField>
      <FormField label="N° CNSS">
        <Controller
          name="numeroCnss"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </FormField>
      <FormField label="N° AMO">
        <Controller
          name="numeroAmo"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </FormField>
      <FormField label="N° CIMR">
        <Controller
          name="numeroCimr"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </FormField>
      <FormField label="RIB">
        <Controller name="rib" control={control} render={({ field }) => <Input {...field} />} />
      </FormField>
      <FormField label="Fin de période d'essai">
        <Controller
          name="periodeEssaiFinLe"
          control={control}
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={(d) => field.onChange(d)}
              onBlur={field.onBlur}
            />
          )}
        />
      </FormField>
      {mode === 'creation' && (
        <>
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
        </>
      )}
      <FormField label="Date d'embauche" required error={errors.dateEmbauche?.message}>
        <Controller
          name="dateEmbauche"
          control={control}
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={(d) => field.onChange(d)}
              onBlur={field.onBlur}
            />
          )}
        />
      </FormField>
      <FormField label="Type de contrat" required>
        <Controller
          name="typeContrat"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={TYPES_CONTRAT.map((t) => ({ label: t, value: t }))}
            />
          )}
        />
      </FormField>
      {typeContratActuel === 'CDD' && (
        <FormField
          label="Date de fin de contrat prévue"
          error={errors.dateFinContratPrevue?.message}
        >
          <Controller
            name="dateFinContratPrevue"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={(d) => field.onChange(d)}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>
      )}
      {(typeContratActuel === 'STAGIAIRE' || typeContratActuel === 'STAGIAIRE_REMUNERE') && (
        <>
          <FormField label="Date de fin de stage prévue" error={errors.dateFinStagePrevue?.message}>
            <Controller
              name="dateFinStagePrevue"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(d) => field.onChange(d)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
          <FormField label="Sujet de stage">
            <Controller
              name="sujetStage"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormField>
        </>
      )}
      {/* En bas, juste au-dessus du footer (Enregistrer/Créer) — pas en haut d'un formulaire long
          et défilable, où l'utilisateur qui vient de cliquer sur le bouton en bas ne le voit pas
          sans remonter. */}
      {errorMessage && <Alert message={errorMessage} />}
    </Dialog>
  )
}
