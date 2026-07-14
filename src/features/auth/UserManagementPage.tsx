import { useState } from 'react'
import { Alert, Button, Form, Input, Modal, Select, Typography, message } from 'antd'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type RoleUtilisateur,
  type UserResponse,
  activateUser,
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
} from '@/lib/authApi'

const { Text } = Typography
const { Option } = Select

const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  admin: 'Admin',
  manager: 'Manager',
}

// ---- Formulaire création ----

interface CreateForm {
  email: string
  motDePasse: string
  role: RoleUtilisateur
  nom: string
  prenom: string
}

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CreateForm>()
  const [apiError, setApiError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void message.success('Compte créé avec succès.')
      form.resetFields()
      setApiError(null)
      onClose()
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la création.')
    },
  })

  function handleClose() {
    form.resetFields()
    setApiError(null)
    onClose()
  }

  return (
    <Modal
      title={
        <Text
          strong
          style={{ fontSize: 16, color: '#1B2A41', fontFamily: "'Source Serif 4', serif" }}
        >
          Nouveau compte
        </Text>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      styles={{ body: { paddingTop: 16 } }}
    >
      {apiError && (
        <Alert
          type="error"
          message={apiError}
          style={{ marginBottom: 16, borderRadius: 8 }}
          showIcon
        />
      )}
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(v) => mutation.mutate(v)}
        size="middle"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Obligatoire' }]}>
            <Input id="create-nom" placeholder="Dupont" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item
            name="prenom"
            label="Prénom"
            rules={[{ required: true, message: 'Obligatoire' }]}
          >
            <Input id="create-prenom" placeholder="Jean" style={{ borderRadius: 8 }} />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="Adresse e-mail"
          rules={[
            { required: true, message: 'Obligatoire' },
            { type: 'email', message: 'Format invalide' },
          ]}
        >
          <Input id="create-email" placeholder="jean.dupont@hbdev.ma" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Obligatoire' }]}>
          <Select id="create-role" placeholder="Sélectionner un rôle" style={{ borderRadius: 8 }}>
            <Option value="admin">Admin</Option>
            <Option value="manager">Manager</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="motDePasse"
          label="Mot de passe temporaire"
          extra={
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              10 caractères min. · majuscule · minuscule · chiffre
            </Text>
          }
          rules={[{ required: true, message: 'Obligatoire' }]}
        >
          <Input.Password
            id="create-password"
            placeholder="••••••••••"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Button onClick={handleClose} style={{ borderRadius: 8 }}>
            Annuler
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            style={{ borderRadius: 8, background: '#1B2A41', borderColor: '#1B2A41' }}
          >
            Créer le compte
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

// ---- Formulaire modification ----

interface EditForm {
  role: RoleUtilisateur
  nom: string
  prenom: string
}

function EditUserModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<EditForm>()
  const [apiError, setApiError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: EditForm) => updateUser(user!.id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void message.success('Compte mis à jour.')
      setApiError(null)
      onClose()
    },
    onError: (err: { message?: string }) => {
      setApiError(err.message ?? 'Erreur lors de la mise à jour.')
    },
  })

  return (
    <Modal
      title={
        <Text
          strong
          style={{ fontSize: 16, color: '#1B2A41', fontFamily: "'Source Serif 4', serif" }}
        >
          Modifier le compte
        </Text>
      }
      open={!!user}
      onCancel={onClose}
      footer={null}
      width={400}
      styles={{ body: { paddingTop: 16 } }}
      afterOpenChange={(open) => {
        if (open && user) {
          form.setFieldsValue({ role: user.role, nom: user.nom, prenom: user.prenom })
        }
      }}
    >
      {apiError && (
        <Alert
          type="error"
          message={apiError}
          style={{ marginBottom: 16, borderRadius: 8 }}
          showIcon
        />
      )}
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(v) => mutation.mutate(v)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 8 }} />
          </Form.Item>
        </div>
        <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
          <Select style={{ borderRadius: 8 }}>
            <Option value="admin">Admin</Option>
            <Option value="manager">Manager</Option>
          </Select>
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Annuler
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            style={{ borderRadius: 8, background: '#1B2A41', borderColor: '#1B2A41' }}
          >
            Enregistrer
          </Button>
        </div>
      </Form>
    </Modal>
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

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void message.success('Compte désactivé.')
    },
    onError: (err: { message?: string }) => {
      void message.error(err.message ?? 'Erreur lors de la désactivation.')
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void message.success('Compte réactivé.')
    },
    onError: (err: { message?: string }) => {
      void message.error(err.message ?? 'Erreur lors de la réactivation.')
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
                {['Nom', 'E-mail', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="pl-5 pr-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">
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
                  <td className="px-4 py-3.5">
                    <StatusTag statut={u.statut === 'actif' ? 'Actif' : 'Inactif'} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {new Date(u.modifieLe).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="pr-5 py-3.5">
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
                            Modal.confirm({
                              title: 'Désactiver ce compte ?',
                              content: `${u.prenom} ${u.nom} ne pourra plus se connecter.`,
                              okText: 'Désactiver',
                              cancelText: 'Annuler',
                              okButtonProps: { danger: true },
                              onOk: () => deactivateMutation.mutate(u.id),
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
