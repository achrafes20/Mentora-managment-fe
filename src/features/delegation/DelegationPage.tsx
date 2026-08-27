import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/StatCard'
import { CornerMark } from '@/components/ui/CornerMark'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { PersonSearch } from '@/components/ui/PersonSearch'
import { DatePicker } from '@/components/ui/DatePicker'
import { Alert } from '@/components/ui/Alert'
import { StatusTag } from '@/components/ui/StatusTag'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import type { ApiError } from '@/lib/apiClient'
import {
  useCreerDelegation,
  useDelegationActive,
  useDelegations,
  useRevoquerDelegation,
  useUtilisateursPourDelegation,
} from './useDelegation'

const schema = z
  .object({
    delegueId: z.string().min(1, 'Le délégué est requis'),
    dateDebut: z.date({ required_error: 'La date de début est requise' }),
    dateFin: z.date({ required_error: 'La date de fin est requise' }),
  })
  .refine((v) => v.dateFin >= v.dateDebut, {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['dateFin'],
  })

type FormValues = z.infer<typeof schema>

export function DelegationPage() {
  const [showForm, setShowForm] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const { data: delegations, isLoading } = useDelegations()
  const { data: active } = useDelegationActive()
  // Le backend renvoie statut="active" dès la création, même si dateDebut est future (seule
  // l'échéance dateFin est reflétée dans statutEffectif() côté serveur) — distinction purement
  // d'affichage ici, pour ne pas annoncer une délégation "active" avant qu'elle ne le soit vraiment.
  const aujourdHui = format(new Date(), 'yyyy-MM-dd')
  const estPlanifiee = Boolean(active?.dateDebut && active.dateDebut > aujourdHui)
  const { data: utilisateurs } = useUtilisateursPourDelegation()
  const creerMutation = useCreerDelegation()
  const revoquerMutation = useRevoquerDelegation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const delegables = (utilisateurs ?? []).filter(
    (u) => u.statut === 'actif' && u.role === 'manager',
  )

  function nomUtilisateur(id?: string): string {
    const u = utilisateurs?.find((u) => u.id === id)
    return u ? `${u.prenom} ${u.nom}` : '—'
  }

  const { trie, tri, handleTri } = useTriLocal(
    delegations,
    (d, champ) => {
      if (champ === 'delegueId') return nomUtilisateur(d.delegueId)
      return d[champ as keyof typeof d] as string | number | boolean | null | undefined
    },
    { champ: 'dateDebut', direction: 'desc' },
  )

  function ouvrirCreation() {
    setErreur(null)
    reset({ delegueId: '', dateDebut: undefined, dateFin: undefined })
    setShowForm(true)
  }

  function soumettre(valeurs: FormValues) {
    creerMutation
      .mutateAsync({
        delegueId: valeurs.delegueId,
        dateDebut: format(valeurs.dateDebut, 'yyyy-MM-dd'),
        dateFin: format(valeurs.dateFin, 'yyyy-MM-dd'),
      })
      .then(() => {
        toast.success('Délégation créée.')
        setShowForm(false)
      })
      .catch((err: ApiError) => setErreur(err.message))
  }

  function demanderRevocation() {
    if (!active?.id) return
    confirm({
      title: estPlanifiee ? 'Annuler cette délégation planifiée ?' : 'Révoquer cette délégation ?',
      content: estPlanifiee
        ? `La délégation prévue pour ${nomUtilisateur(active.delegueId)} sera annulée avant son démarrage.`
        : `${nomUtilisateur(active.delegueId)} perdra immédiatement les droits d'approbation délégués.`,
      okText: estPlanifiee ? 'Annuler la délégation' : 'Révoquer',
      onOk: async () => {
        try {
          await revoquerMutation.mutateAsync(active.id as string)
          toast.success('Délégation révoquée.')
        } catch (err) {
          toast.error((err as ApiError).message)
        }
      },
    })
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Délégation d'approbation"
        subtitle="Désigner un délégué temporaire"
        actions={
          !active && (
            <button
              onClick={ouvrirCreation}
              className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white"
            >
              <Plus size={13} /> Déléguer temporairement
            </button>
          )
        }
      />

      {active ? (
        <div className="relative mb-6 max-w-md rounded-xl border border-[#D8D4CC] bg-white p-5">
          <CornerMark />
          <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            {estPlanifiee ? 'Délégation planifiée' : 'Délégation active'}
          </p>
          <p className="mt-2 text-[16px] font-semibold text-[#1B2A41]">
            {nomUtilisateur(active.delegueId)}
          </p>
          <p className="mt-1 text-[12px] text-[#6B7280]">
            {estPlanifiee ? (
              <>
                À partir du{' '}
                <span style={{ fontFamily: 'var(--font-code)' }}>{active.dateDebut}</span> jusqu'au{' '}
                <span style={{ fontFamily: 'var(--font-code)' }}>{active.dateFin}</span>
              </>
            ) : (
              <>
                Jusqu'au <span style={{ fontFamily: 'var(--font-code)' }}>{active.dateFin}</span>
              </>
            )}
          </p>
          <button
            onClick={demanderRevocation}
            className="mt-4 rounded-lg border border-[#C1495A]/30 px-3 py-1.5 text-[12px] text-[#C1495A] hover:bg-[#C1495A]/8"
          >
            {estPlanifiee ? 'Annuler' : 'Révoquer'}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-[#D8D4CC] bg-white p-8 text-center">
          <p className="text-[13px] text-[#6B7280]">Aucune délégation active</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 max-w-md rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-[#1B2A41]">Nouvelle délégation</h3>
          {erreur && <Alert message={erreur} />}
          <div className="space-y-3">
            <FormField label="Délégué" required error={errors.delegueId?.message}>
              <Controller
                name="delegueId"
                control={control}
                render={({ field }) => (
                  <PersonSearch
                    label=""
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    personnes={delegables}
                    placeholder="Rechercher un manager…"
                  />
                )}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date de début" required error={errors.dateDebut?.message}>
                <Controller
                  name="dateDebut"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>
              <FormField label="Date de fin" required error={errors.dateFin?.message}>
                <Controller
                  name="dateFin"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Le délégué obtient les droits d'approbation des demandes et de décision de
              recrutement. Pas de gestion des comptes ni de configuration.
            </p>
            <div className="flex gap-2">
              <Button loading={creerMutation.isPending} onClick={handleSubmit(soumettre)}>
                Activer
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Historique</h3>
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              <SortableTh label="Délégué" champ="delegueId" tri={tri} onChange={handleTri} />
              <SortableTh label="Période" champ="dateDebut" tri={tri} onChange={handleTri} />
              <SortableTh label="Statut" champ="statut" tri={tri} onChange={handleTri} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Chargement…
                </td>
              </tr>
            ) : (
              trie.map((d) => (
                <tr key={d.id} className="hover:bg-[#F7F7F4]">
                  <td className="px-4 py-3.5 text-[13px] text-[#1B2A41]">
                    {nomUtilisateur(d.delegueId)}
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {d.dateDebut} – {d.dateFin}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={formatStatut(d.statut ?? '')} />
                  </td>
                </tr>
              ))
            )}
            {!isLoading && (delegations ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Aucune délégation pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
