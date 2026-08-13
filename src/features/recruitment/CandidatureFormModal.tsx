import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FileText, Paperclip, X } from 'lucide-react'
import type { OffreEmploi } from './recruitmentApi'

const schema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().min(1, "L'e-mail est requis").email('E-mail invalide'),
  telephone: z.string(),
  offreId: z.string(),
  notes: z.string(),
})

export type CandidatureFormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  offres: OffreEmploi[]
  onCancel: () => void
  onSubmit: (values: CandidatureFormValues, cv: File | null) => void
  submitting: boolean
  errorMessage?: string | null
}

// Candidat reçu au bureau (CV papier ou pas encore numérisé, présenté en personne) — offre
// optionnelle (une candidature spontanée sur place n'est pas différente d'un e-mail spontané qui
// ne matche aucune offre ouverte) et CV optionnel : l'analyse IA n'est jamais déclenchée à la
// création, l'Admin la lance lui-même via "Relancer l'analyse" une fois prêt.
export function CandidatureFormModal({
  open,
  offres,
  onCancel,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  const [cv, setCv] = useState<File | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CandidatureFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', prenom: '', email: '', telephone: '', offreId: '', notes: '' },
  })

  function fermer() {
    onCancel()
    reset()
    setCv(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && fermer()}
      title="Nouvelle candidature"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          <Button loading={submitting} onClick={handleSubmit((values) => onSubmit(values, cv))}>
            Créer
          </Button>
        </>
      }
    >
      {errorMessage && <Alert message={errorMessage} />}
      <p className="mb-3 text-[12px] text-[#6B7280]">
        Candidat reçu au bureau — l'analyse IA du CV n'est pas lancée automatiquement, utilisez «
        Relancer l'analyse » depuis la fiche une fois prêt.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Prénom" required error={errors.prenom?.message}>
          <Controller
            name="prenom"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormField>
        <FormField label="Nom" required error={errors.nom?.message}>
          <Controller name="nom" control={control} render={({ field }) => <Input {...field} />} />
        </FormField>
      </div>
      <FormField label="E-mail" required error={errors.email?.message}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => <Input {...field} type="email" />}
        />
      </FormField>
      <FormField label="Téléphone">
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </FormField>
      <FormField label="Offre liée" hint="Optionnel — assignable aussi plus tard depuis la fiche.">
        <Controller
          name="offreId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Aucune offre"
              options={[
                { value: '', label: 'Aucune offre' },
                ...offres
                  .filter((o) => o.id)
                  .map((o) => ({ value: o.id as string, label: o.intitule ?? '' })),
              ]}
            />
          )}
        />
      </FormField>

      <div className="mt-1 mb-4">
        <span className="text-[12px] font-medium text-[#1B2A41]">CV</span>
        {cv ? (
          <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2">
            <span className="flex items-center gap-2 truncate text-[12px] text-[#1B2A41]">
              <Paperclip size={14} className="shrink-0 text-[#6B7280]" />
              <span className="truncate">{cv.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setCv(null)}
              className="shrink-0 text-[#9CA3AF] hover:text-[#C1495A]"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#D8D4CC] bg-white px-3 py-2.5 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
            <FileText size={14} />
            Choisir un fichier (optionnel — PDF, DOC, DOCX, JPEG ou PNG)
            <input
              type="file"
              accept="application/pdf,.doc,.docx,image/jpeg,image/png"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        )}
      </div>

      <FormField label="Notes" hint="Contexte de la rencontre, disponibilité, etc.">
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={3}
              className="w-full rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
            />
          )}
        />
      </FormField>
    </Dialog>
  )
}
