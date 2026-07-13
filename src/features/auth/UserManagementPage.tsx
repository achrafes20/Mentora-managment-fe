import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
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

const { Title, Text } = Typography
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

  const columns = [
    {
      title: 'Nom',
      key: 'nom',
      render: (_: unknown, u: UserResponse) => (
        <Text strong style={{ color: '#1B2A41' }}>
          {u.prenom} {u.nom}
        </Text>
      ),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Text style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#1B2A41' }}>
          {email}
        </Text>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role: RoleUtilisateur) => (
        <Tag
          color={role === 'admin' ? '#1B2A41' : '#4A7C6B'}
          style={{ borderRadius: 6, fontSize: 12, fontWeight: 500 }}
        >
          {ROLE_LABELS[role]}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut: string) =>
        statut === 'actif' ? (
          <Badge
            status="success"
            text={<Text style={{ color: '#4A7C6B', fontSize: 13 }}>Actif</Text>}
          />
        ) : (
          <Badge
            status="default"
            text={<Text style={{ color: '#6B7280', fontSize: 13 }}>Inactif</Text>}
          />
        ),
    },
    {
      title: 'Dernière connexion',
      dataIndex: 'modifieLe',
      key: 'modifieLe',
      render: (d: string) => (
        <Text style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#6B7280' }}>
          {new Date(d).toLocaleDateString('fr-FR')}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, u: UserResponse) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => setEditUser(u)}
            style={{ borderRadius: 6, borderColor: '#D8D4CC', color: '#1B2A41', fontSize: 13 }}
          >
            Modifier
          </Button>
          {u.statut === 'actif' ? (
            <Button
              size="small"
              icon={<StopOutlined />}
              danger
              onClick={() => {
                Modal.confirm({
                  title: 'Désactiver ce compte ?',
                  content: `${u.prenom} ${u.nom} ne pourra plus se connecter.`,
                  okText: 'Désactiver',
                  cancelText: 'Annuler',
                  okButtonProps: {
                    danger: true,
                    style: { borderRadius: 8 },
                  },
                  onOk: () => deactivateMutation.mutate(u.id),
                })
              }}
              style={{ borderRadius: 6, fontSize: 13 }}
            >
              Désactiver
            </Button>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => activateMutation.mutate(u.id)}
              style={{
                borderRadius: 6,
                borderColor: '#4A7C6B',
                color: '#4A7C6B',
                fontSize: 13,
              }}
            >
              Réactiver
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '32px 0' }}>
      {/* En-tête */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={3}
            style={{
              margin: 0,
              color: '#1B2A41',
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontWeight: 600,
            }}
          >
            Comptes utilisateurs
          </Title>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            {users.length} compte{users.length !== 1 ? 's' : ''} — admin et managers
          </Text>
        </div>
        <Button
          id="create-user-btn"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{
            height: 40,
            borderRadius: 8,
            background: '#1B2A41',
            borderColor: '#1B2A41',
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontWeight: 500,
          }}
        >
          Créer un compte
        </Button>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <Alert
          type="error"
          message="Impossible de charger les comptes utilisateurs."
          style={{ marginBottom: 16, borderRadius: 8 }}
          showIcon
        />
      )}

      {/* Tableau */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #D8D4CC',
          overflow: 'hidden',
        }}
      >
        <Table<UserResponse>
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          size="middle"
          locale={{ emptyText: 'Aucun compte utilisateur.' }}
          style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
        />
      </div>

      {/* Modales */}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />

      {/* Note sécurité */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <PauseCircleOutlined style={{ color: '#6B7280', fontSize: 13 }} />
        <Text style={{ color: '#6B7280', fontSize: 13 }}>
          Ce tableau ne contient pas les fiches employés (EMP-XXX). Les comptes ici donnent
          uniquement accès à la plateforme (rôle Admin ou Manager).
        </Text>
      </div>
    </div>
  )
}
