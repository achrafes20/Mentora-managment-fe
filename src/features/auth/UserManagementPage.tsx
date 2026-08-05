import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import {
  type RoleUtilisateur,
  type UserResponse,
  activateUser,
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
} from '@/lib/authApi'

const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  admin: 'Admin',
  manager: 'Manager',
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
]

// ---- Formulaire création ----

const createSchema = z.object({
  nom: z.string().min(1, 'Obligatoire'),
  prenom: z.string().min(1, 'Obligatoire'),
  email: z.string().min(1, 'Obligatoire').email('Format invalide'),
  role: z.enum(['admin', 'manager'], { required_error: 'Obligatoire' }),
  motDePasse: z.string().min(1, 'Obligatoire'),
  mattermostUserId: z.string().max(64, '64 caracteres maximum').optional(),
})

type CreateForm = z.infer<typeof createSchema>

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      role: 'manager',
      motDePasse: '',
      mattermostUserId: '',
    },
  })

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte créé avec succès.')
      reset()
      setApiError(null)
      onClose()
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la création.')
    },
  })

  function handleClose() {
    reset()
    setApiError(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Nouveau compte"
      width={480}
    >
      {apiError && <Alert message={apiError} />}
      <form
        onSubmit={handleSubmit((v) =>
          mutation.mutate({ ...v, mattermostUserId: v.mattermostUserId?.trim() || null }),
        )}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormField label="Nom" required error={errors.nom?.message} htmlFor="create-nom">
            <Controller
              name="nom"
              control={control}
              render={({ field }) => <Input id="create-nom" placeholder="Dupont" {...field} />}
            />
          </FormField>
          <FormField label="Prénom" required error={errors.prenom?.message} htmlFor="create-prenom">
            <Controller
              name="prenom"
              control={control}
              render={({ field }) => <Input id="create-prenom" placeholder="Jean" {...field} />}
            />
          </FormField>
        </div>
        <FormField
          label="Adresse e-mail"
          required
          error={errors.email?.message}
          htmlFor="create-email"
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input id="create-email" placeholder="jean.dupont@hbdev.ma" {...field} />
            )}
          />
        </FormField>
        <FormField label="Rôle" required error={errors.role?.message} htmlFor="create-role">
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                id="create-role"
                placeholder="Sélectionner un rôle"
                options={ROLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>
        <FormField
          label="Mot de passe temporaire"
          required
          error={errors.motDePasse?.message}
          hint="10 caractères min. · majuscule · minuscule · chiffre"
          htmlFor="create-password"
        >
          <Controller
            name="motDePasse"
            control={control}
            render={({ field }) => (
              <Input id="create-password" type="password" placeholder="••••••••••" {...field} />
            )}
          />
        </FormField>
        <FormField
          label="ID utilisateur Mattermost"
          error={errors.mattermostUserId?.message}
          hint="Optionnel. Utilise pour les notifications privees Mattermost."
          htmlFor="create-mattermost-user-id"
        >
          <Controller
            name="mattermostUserId"
            control={control}
            render={({ field }) => (
              <Input id="create-mattermost-user-id" placeholder="ex: 9x8..." {...field} />
            )}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Créer le compte
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ---- Formulaire modification ----

const editSchema = z.object({
  nom: z.string().min(1, 'Obligatoire'),
  prenom: z.string().min(1, 'Obligatoire'),
  role: z.enum(['admin', 'manager'], { required_error: 'Obligatoire' }),
  mattermostUserId: z.string().max(64, '64 caracteres maximum').optional(),
})

type EditForm = z.infer<typeof editSchema>

function EditUserModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { nom: '', prenom: '', role: 'manager', mattermostUserId: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: EditForm) =>
      updateUser(user!.id, {
        ...data,
        mattermostUserId: data.mattermostUserId?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte mis à jour.')
      setApiError(null)
      onClose()
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la mise à jour.')
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        mattermostUserId: user.mattermostUserId ?? '',
      })
    }
  }, [user, reset])

  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => !o && onClose()}
      title="Modifier le compte"
      width={480}
    >
      {apiError && <Alert message={apiError} />}
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div className="grid grid-cols-2 gap-x-4">
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
        </div>
        <FormField label="Rôle" required error={errors.role?.message}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                options={ROLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>
        <FormField
          label="ID utilisateur Mattermost"
          error={errors.mattermostUserId?.message}
          hint="Optionnel. Utilise pour les messages prives."
        >
          <Controller
            name="mattermostUserId"
            control={control}
            render={({ field }) => <Input placeholder="ex: 9x8..." {...field} />}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ---- Page principale ----

/**
 * EF-AUTH-16/17 — Gestion des comptes utilisateurs (Admin uniquement).
 * Spec : docs/ui-design/auth-screen.md §13
 */
export function UserManagementPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserResponse | null>(null)

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const { trie, tri, handleTri } = useTriLocal(
    users,
    (u, champ) => {
      if (champ === 'nom') return `${u.prenom} ${u.nom}`
      return u[champ as keyof typeof u] as string | number | boolean | null | undefined
    },
    { champ: 'nom', direction: 'asc' },
  )

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte désactivé.')
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'Erreur lors de la désactivation.')
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte réactivé.')
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'Erreur lors de la réactivation.')
    },
  })

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Comptes utilisateurs"
        subtitle={`${users.length} compte${users.length !== 1 ? 's' : ''} — admin et managers`}
        actions={
          <button
            id="create-user-btn"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#243650]"
          >
            <Plus size={13} /> Créer un compte
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[13px] text-[#C1495A]">
          Impossible de charger les comptes utilisateurs.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Aucun compte utilisateur.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                <SortableTh
                  label="Nom"
                  champ="nom"
                  tri={tri}
                  onChange={handleTri}
                  className="first:pl-5"
                />
                <SortableTh label="E-mail" champ="email" tri={tri} onChange={handleTri} />
                <SortableTh label="Rôle" champ="role" tri={tri} onChange={handleTri} />
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Mattermost
                </th>
                <SortableTh label="Statut" champ="statut" tri={tri} onChange={handleTri} />
                <SortableTh
                  label="Dernière connexion"
                  champ="modifieLe"
                  tri={tri}
                  onChange={handleTri}
                />
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase last:pr-5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {trie.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="py-3.5 pr-4 pl-5 text-[13px] font-medium text-[#1B2A41]">
                    {u.prenom} {u.nom}
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        u.role === 'admin'
                          ? 'bg-[#1B2A41]/10 text-[#1B2A41]'
                          : 'bg-[#4A7C6B]/10 text-[#4A7C6B]'
                      }`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {u.mattermostUserId ? (
                      <span title={u.mattermostUserId}>{u.mattermostUserId.slice(0, 8)}...</span>
                    ) : (
                      <span className="text-[#9CA3AF]">Email</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={u.statut === 'actif' ? 'Actif' : 'Inactif'} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {new Date(u.modifieLe).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3.5 pr-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="rounded-lg border border-[#D8D4CC] px-2.5 py-1 text-[11px] text-[#1B2A41] hover:border-[#1B2A41]"
                      >
                        Modifier
                      </button>
                      {u.statut === 'actif' ? (
                        <button
                          onClick={() => {
                            confirm({
                              title: 'Désactiver ce compte ?',
                              content: `${u.prenom} ${u.nom} ne pourra plus se connecter.`,
                              okText: 'Désactiver',
                              cancelText: 'Annuler',
                              danger: true,
                              onOk: () => deactivateMutation.mutateAsync(u.id).then(() => {}),
                            })
                          }}
                          className="rounded-lg border border-[#C1495A]/30 px-2.5 py-1 text-[11px] text-[#C1495A] hover:bg-[#C1495A]/8"
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => activateMutation.mutate(u.id)}
                          className="rounded-lg border border-[#4A7C6B]/30 px-2.5 py-1 text-[11px] text-[#4A7C6B] hover:bg-[#4A7C6B]/8"
                        >
                          Réactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />

      <p className="mt-4 text-[12px] text-[#9CA3AF]">
        Ce tableau ne contient pas les fiches employés. Les comptes ici donnent uniquement accès à
        la plateforme (rôle Admin ou Manager).
      </p>
    </div>
  )
}
