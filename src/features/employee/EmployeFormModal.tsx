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
    // Optionnel côté backend (EmployeRequete#poste n'est pas @NotBlank), mais requis côté UI —
    // une fiche sans poste renseigné n'a pas de sens pour une entreprise qui produit des
    // attestations de travail/salaire mentionnant le poste. N'introduit aucune régression : le
    // backend acceptait déjà une valeur non vide avant ce durcissement du formulaire.
    poste: z.string().min(1, 'Le poste est requis'),
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
    // EF-EMP-17 : donnée sensible, éditée via son propre endpoint (/salaire), pas via
    // creer()/modifier() — cf. onSubmit des deux appelants (EmployesListTab, EmployeDetailPage)
    // qui l'envoient séparément après la création/modification du reste de la fiche.
    salaireBrutMensuel: z.number().nullable(),
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
  // EF-EMP-14 : "Affilié à la CIMR ?" n'existe pas comme champ backend (seul numeroCimr existe) —
  // état purement local qui pilote l'affichage du champ N° CIMR, jamais soumis tel quel. Par
  // défaut "Non" à la création (pas de sur-affichage d'un champ optionnel rarement utilisé) ;
  // reflète la donnée existante en édition (cf. effet de reset ci-dessous).
  const [affilieCimr, setAffilieCimr] = useState(false)
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
      salaireBrutMensuel: null,
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
        salaireBrutMensuel: employe?.salaireBrutMensuel ?? null,
      })
      setAffilieCimr(!!employe?.numeroCimr)
      setPhoto(null)
      setPhotoPreview(null)
    }
  }, [open, employe, prefill, mode, reset])

  const typeContratActuel = watch('typeContrat')
  const departementIdActuel = watch('departementId')
  const managerIdActuel = watch('managerId')
  const prenomActuel = watch('prenom')
  const nomActuel = watch('nom')
  const apercuPhoto = photoPreview ?? photoExistante

  // Un seul manager par département (Departement.managerId) : le champ n'est plus éditable
  // manuellement (cf. FormField "Manager rattaché" ci-dessous, purement informatif) — il découle
  // toujours du département choisi, jamais saisi indépendamment.
  useEffect(() => {
    if (mode !== 'creation') return
    const managerDuDepartement = departements.find((d) => d.id === departementIdActuel)?.managerId
    setValue('managerId', managerDuDepartement ?? '')
  }, [departementIdActuel, departements, mode, setValue])

  const managerActuel = managers.find((m) => m.id === managerIdActuel)

  // Un seul des deux champs de fin est pertinent selon le type de contrat : on efface l'autre pour
  // qu'il ne reste pas une valeur fantôme rejetée par le schéma (refine ci-dessus) une fois masqué.
  useEffect(() => {
    if (typeContratActuel !== 'CDD') {
      setValue('dateFinContratPrevue', null)
    }
    if (typeContratActuel !== 'STAGIAIRE' && typeContratActuel !== 'STAGIAIRE_REMUNERE') {
      setValue('dateFinStagePrevue', null)
      setValue('sujetStage', '')
    } else {
      // Pas de "période d'essai" légale pour un stagiaire (cf. FormField masqué ci-dessous).
      setValue('periodeEssaiFinLe', null)
    }
  }, [typeContratActuel, setValue])

  // Si l'utilisateur bascule "Affilié CIMR ?" sur Non après avoir saisi un numéro, on l'efface
  // plutôt que de le laisser masqué-mais-soumis (cf. commentaire sur affilieCimr ci-dessus).
  useEffect(() => {
    if (!affilieCimr) {
      setValue('numeroCimr', '')
    }
  }, [affilieCimr, setValue])

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
      {/* Formulaire organisé en 5 sections par ordre d'importance : identité, poste/organisation
          (le plus structurant — département/manager/contrat conditionnent le reste de la fiche),
          coordonnées, conformité sociale Maroc, puis paie. Grille 2 colonnes desktop / 1 colonne
          mobile (md:grid-cols-2, même convention que CandidatureFormModal). */}

      <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Informations personnelles</h3>
      <FormField label="Photo">
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
      <div className="grid gap-x-4 md:grid-cols-2">
        <FormField label="Nom" required error={errors.nom?.message}>
          <Controller name="nom" control={control} render={({ field }) => <Input {...field} />} />
        </FormField>
        <FormField label="Prénom" required error={errors.prenom?.message}>
          <Controller
            name="prenom"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormField>
        <FormField label="CIN">
          <Controller name="cin" control={control} render={({ field }) => <Input {...field} />} />
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
        </FormField>
      </div>

      <h3 className="mt-5 mb-3 border-t border-[#D8D4CC] pt-4 text-[13px] font-semibold text-[#1B2A41]">
        Informations professionnelles
      </h3>
      <div className="grid gap-x-4 md:grid-cols-2">
        {mode === 'creation' && (
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
        )}
        <FormField label="Poste" required error={errors.poste?.message}>
          <Controller name="poste" control={control} render={({ field }) => <Input {...field} />} />
        </FormField>
        {mode === 'creation' && (
          // Un seul manager par département (Departement.managerId) : plus de choix manuel, ce
          // champ reflète juste le manager déjà rattaché au département sélectionné ci-dessus.
          <FormField label="Manager rattaché">
            <div className="rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] text-[#6B7280]">
              {departementIdActuel
                ? managerActuel
                  ? libelleManager(managerActuel)
                  : 'Aucun manager pour ce département'
                : 'Choisissez un département'}
            </div>
          </FormField>
        )}
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
        {typeContratActuel !== 'STAGIAIRE' && typeContratActuel !== 'STAGIAIRE_REMUNERE' && (
          // Un stagiaire n'a pas de "période d'essai" au sens légal (pas de contrat de travail,
          // le stage est encadré par une convention) — ce champ n'est pertinent que pour CDI/CDD.
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
        )}
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
            <FormField
              label="Date de fin de stage prévue"
              error={errors.dateFinStagePrevue?.message}
            >
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
      </div>

      <h3 className="mt-5 mb-3 border-t border-[#D8D4CC] pt-4 text-[13px] font-semibold text-[#1B2A41]">
        Coordonnées
      </h3>
      <div className="grid gap-x-4 md:grid-cols-2">
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
      </div>

      <h3 className="mt-5 mb-1 border-t border-[#D8D4CC] pt-4 text-[13px] font-semibold text-[#1B2A41]">
        Informations sociales
      </h3>

      <div className="grid gap-x-4 md:grid-cols-2">
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
        <FormField label="Affilié à la CIMR ?">
          <Select
            value={affilieCimr ? 'oui' : 'non'}
            onChange={(v) => setAffilieCimr(v === 'oui')}
            options={[
              { value: 'non', label: 'Non' },
              { value: 'oui', label: 'Oui' },
            ]}
          />
        </FormField>
        {affilieCimr && (
          <FormField label="N° CIMR">
            <Controller
              name="numeroCimr"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormField>
        )}
      </div>

      <h3 className="mt-5 mb-3 border-t border-[#D8D4CC] pt-4 text-[13px] font-semibold text-[#1B2A41]">
        Informations de paie
      </h3>
      <div className="grid gap-x-4 md:grid-cols-2">
        <FormField label="RIB">
          <Controller name="rib" control={control} render={({ field }) => <Input {...field} />} />
        </FormField>
        <FormField label="Salaire brut mensuel (MAD)">
          <Controller
            name="salaireBrutMensuel"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                step="0.01"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value === '' ? null : Number(e.target.value))
                }
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>
      </div>

      {/* En bas, juste au-dessus du footer (Enregistrer/Créer) — pas en haut d'un formulaire long
          et défilable, où l'utilisateur qui vient de cliquer sur le bouton en bas ne le voit pas
          sans remonter. */}
      {errorMessage && <Alert message={errorMessage} />}
    </Dialog>
  )
}
