import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/lib/AuthContext'
import { changerEmail, changerMotDePasse } from '@/lib/authApi'

/**
 * Modification de ses propres identifiants (e-mail, mot de passe), accessible à tout utilisateur
 * connecté depuis le bloc profil de la barre latérale.
 *
 * Le changement de mot de passe exige le mot de passe actuel (une session dérobée mais
 * authentifiée ne doit pas suffire à le remplacer sans le connaître). Le changement d'e-mail n'a
 * pas cette exigence — décision produit : un seul compte Admin en pratique, écran accessible
 * seulement une fois déjà authentifié.
 *
 * Les deux déconnectent l'utilisateur en cas de succès : le backend révoque toutes les sessions
 * actives, y compris celle en cours, donc le jeton en main ne redeviendra pas valide — inutile
 * d'essayer de le garder vivant côté client.
 */

/**
 * Schéma construit dynamiquement (pas une constante de module) : le refine doit comparer à
 * l'e-mail actuel de l'utilisateur connecté. Sans ce contrôle, soumettre sa propre adresse comme
 * "nouvel e-mail" était accepté en silence — aucun changement réel, mais la session était quand
 * même révoquée, ce qui donnait l'impression que la fonctionnalité était cassée.
 */
function buildEmailSchema(currentEmail: string) {
  return z.object({
    nouvelEmail: z
      .string()
      .min(1, 'Obligatoire')
      .email('Format invalide')
      .refine((v) => v.toLowerCase() !== currentEmail.toLowerCase(), {
        message: 'Doit être différent de votre e-mail actuel',
      }),
  })
}
type EmailForm = { nouvelEmail: string }

const passwordSchema = z
  .object({
    motDePasseActuel: z.string().min(1, 'Obligatoire'),
    nouveauMotDePasse: z
      .string()
      .min(10, '10 caractères minimum')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/\d/, 'Au moins un chiffre'),
    confirmerMotDePasse: z.string().min(1, 'Obligatoire'),
  })
  .refine((v) => v.nouveauMotDePasse === v.confirmerMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerMotDePasse'],
  })
type PasswordForm = z.infer<typeof passwordSchema>

/** Après un changement réussi : toutes les sessions sont révoquées côté backend, on se déconnecte. */
async function apresChangementReussi(
  message: string,
  onClose: () => void,
  signOut: () => Promise<void>,
) {
  toast.success(message)
  onClose()
  await signOut()
}

function ChangerEmailForm({
  currentEmail,
  onClose,
  signOut,
}: {
  currentEmail: string
  onClose: () => void
  signOut: () => Promise<void>
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(buildEmailSchema(currentEmail)),
    defaultValues: { nouvelEmail: '' },
  })

  const mutation = useMutation({
    mutationFn: (v: EmailForm) => changerEmail(v.nouvelEmail),
    onSuccess: () => {
      reset()
      setApiError(null)
      void apresChangementReussi(
        'E-mail modifié. Reconnectez-vous avec votre nouvelle adresse.',
        onClose,
        signOut,
      )
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la modification.')
    },
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-1">
      {apiError && <Alert message={apiError} />}
      <FormField
        label="Nouvel e-mail"
        required
        error={errors.nouvelEmail?.message}
        hint={`Actuellement : ${currentEmail}`}
        htmlFor="email-nouveau"
      >
        <Controller
          name="nouvelEmail"
          control={control}
          render={({ field }) => (
            <Input id="email-nouveau" placeholder="jean.dupont@hbdev.ma" {...field} />
          )}
        />
      </FormField>
      <div className="mt-2 flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          Changer l&apos;e-mail
        </Button>
      </div>
    </form>
  )
}

function ChangerMotDePasseForm({
  onClose,
  signOut,
}: {
  onClose: () => void
  signOut: () => Promise<void>
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { motDePasseActuel: '', nouveauMotDePasse: '', confirmerMotDePasse: '' },
  })

  const nouveauMotDePasse = watch('nouveauMotDePasse')
  const criteria = [
    { label: '10 caractères minimum', ok: nouveauMotDePasse.length >= 10 },
    { label: 'Au moins une majuscule', ok: /[A-Z]/.test(nouveauMotDePasse) },
    { label: 'Au moins une minuscule', ok: /[a-z]/.test(nouveauMotDePasse) },
    { label: 'Au moins un chiffre', ok: /\d/.test(nouveauMotDePasse) },
  ]

  const mutation = useMutation({
    mutationFn: (v: PasswordForm) => changerMotDePasse(v.motDePasseActuel, v.nouveauMotDePasse),
    onSuccess: () => {
      reset()
      setApiError(null)
      void apresChangementReussi(
        'Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe.',
        onClose,
        signOut,
      )
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la modification.')
    },
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-1">
      {apiError && <Alert message={apiError} />}
      <FormField
        label="Mot de passe actuel"
        required
        error={errors.motDePasseActuel?.message}
        htmlFor="mdp-actuel"
      >
        <Controller
          name="motDePasseActuel"
          control={control}
          render={({ field }) => <Input id="mdp-actuel" type="password" {...field} />}
        />
      </FormField>
      <FormField
        label="Nouveau mot de passe"
        required
        error={errors.nouveauMotDePasse?.message}
        htmlFor="mdp-nouveau"
      >
        <Controller
          name="nouveauMotDePasse"
          control={control}
          render={({ field }) => <Input id="mdp-nouveau" type="password" {...field} />}
        />
      </FormField>
      <div className="space-y-1.5 py-1">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <div
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                c.ok ? 'bg-[#4A7C6B]' : 'bg-[#D8D4CC]'
              }`}
            >
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
            <span
              className={`text-[11px] transition-colors ${c.ok ? 'text-[#4A7C6B]' : 'text-[#9CA3AF]'}`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <FormField
        label="Confirmer le mot de passe"
        required
        error={errors.confirmerMotDePasse?.message}
        htmlFor="mdp-confirmer"
      >
        <Controller
          name="confirmerMotDePasse"
          control={control}
          render={({ field }) => <Input id="mdp-confirmer" type="password" {...field} />}
        />
      </FormField>
      <div className="mt-2 flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          Changer le mot de passe
        </Button>
      </div>
    </form>
  )
}

export function MonCompteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title="Mon compte" width={480}>
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-[12px] font-semibold text-[#1B2A41]">Adresse e-mail</h3>
          <ChangerEmailForm currentEmail={user.email} onClose={onClose} signOut={signOut} />
        </section>

        <div className="border-t border-[#D8D4CC]" />

        <section>
          <h3 className="mb-2 text-[12px] font-semibold text-[#1B2A41]">Mot de passe</h3>
          <ChangerMotDePasseForm onClose={onClose} signOut={signOut} />
        </section>
      </div>
    </Dialog>
  )
}
