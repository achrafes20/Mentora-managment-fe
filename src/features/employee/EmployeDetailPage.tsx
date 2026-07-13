import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form as AntForm,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { Controller, type FieldError, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../lib/AuthContext'
import type { ApiError } from '../../lib/apiClient'
import { ouvrirDocument } from './employesApi'
import { useDepartements } from './useDepartements'
import { EmployeFormModal, type EmployeFormValues } from './EmployeFormModal'
import {
  useAttacherDocument,
  useDesactiverEmploye,
  useDocumentsEmploye,
  useEmploye,
  useHistoriqueTransferts,
  useModifierEmploye,
  useTransfererEmploye,
} from './useEmployes'
import { libelleManager, type Manager, useManagers } from './useManagers'

const MOTIFS_DEPART = ['demission', 'licenciement', 'fin_cdd', 'rupture', 'autre'] as const

export function EmployeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const { data: employe, isLoading, error } = useEmploye(id)
  const { data: departements } = useDepartements()
  const { data: managers } = useManagers()
  const { data: documents } = useDocumentsEmploye(id)
  const { data: transferts } = useHistoriqueTransferts(id)

  const modifierMutation = useModifierEmploye(id ?? '')
  const transfererMutation = useTransfererEmploye(id ?? '')
  const desactiverMutation = useDesactiverEmploye(id ?? '')
  const attacherMutation = useAttacherDocument(id ?? '')

  const [modaleEdition, setModaleEdition] = useState(false)
  const [modaleTransfert, setModaleTransfert] = useState(false)
  const [modaleDesactivation, setModaleDesactivation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (isLoading) {
    return <Spin />
  }
  if (error || !employe) {
    return <Alert type="error" showIcon message="Employé introuvable" />
  }

  function nomDepartement(departementId?: string) {
    return departements?.find((d) => d.id === departementId)?.nom ?? departementId ?? '—'
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', display: 'flex' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {employe.prenom} {employe.nom}
        </Typography.Title>
        <Space>
          <Button onClick={() => navigate('/employes')}>Retour à la liste</Button>
          {estAdmin && (
            <>
              <Button onClick={() => setModaleEdition(true)}>Modifier</Button>
              <Button
                onClick={() => setModaleTransfert(true)}
                disabled={employe.statut === 'inactif'}
              >
                Transférer
              </Button>
              <Button
                danger
                onClick={() => setModaleDesactivation(true)}
                disabled={employe.statut === 'inactif'}
              >
                Désactiver
              </Button>
            </>
          )}
        </Space>
      </Space>

      {erreur && (
        <Alert
          type="error"
          message={erreur}
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setErreur(null)}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Statut">
            <Tag color={employe.statut === 'actif' ? 'green' : 'default'}>{employe.statut}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Département">{employe.departementNom}</Descriptions.Item>
          <Descriptions.Item label="Poste">{employe.poste || '—'}</Descriptions.Item>
          <Descriptions.Item label="Type de contrat">{employe.typeContrat}</Descriptions.Item>
          <Descriptions.Item label="E-mail">{employe.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="Téléphone">{employe.telephone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Date d'embauche">{employe.dateEmbauche}</Descriptions.Item>
          {employe.typeContrat === 'CDD' && (
            <Descriptions.Item label="Fin de contrat prévue">
              {employe.dateFinContratPrevue || '—'}
            </Descriptions.Item>
          )}
          {employe.statut === 'inactif' && (
            <>
              <Descriptions.Item label="Date de départ">{employe.dateDepart}</Descriptions.Item>
              <Descriptions.Item label="Motif de départ">{employe.motifDepart}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Card title="Planning télétravail" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Aucun planning pour l'instant — branché en T2.A1 (encart en lecture seule).
        </Typography.Text>
      </Card>

      <Card title="Documents" style={{ marginBottom: 16 }}>
        {estAdmin && (
          <UploadDocument
            onUpload={(fichier, typeDocument) => attacherMutation.mutate({ fichier, typeDocument })}
          />
        )}
        <List
          style={{ marginTop: 16 }}
          dataSource={documents}
          locale={{ emptyText: 'Aucun document' }}
          renderItem={(doc) => (
            <List.Item>
              <a
                onClick={(e) => {
                  e.preventDefault()
                  ouvrirDocument(id as string, doc.id as string).catch(
                    (err: ApiError) => void message.error(err.message),
                  )
                }}
              >
                {doc.nomOriginal}
              </a>{' '}
              {doc.typeDocument && <Tag>{doc.typeDocument}</Tag>}
            </List.Item>
          )}
        />
      </Card>

      <Card title="Historique des transferts">
        <List
          dataSource={transferts}
          locale={{ emptyText: 'Aucun transfert' }}
          renderItem={(t) => (
            <List.Item>
              {t.dateEffet} — vers département {nomDepartement(t.nouveauDepartementId)}
            </List.Item>
          )}
        />
      </Card>

      <EmployeFormModal
        open={modaleEdition}
        mode="edition"
        employe={employe}
        departements={departements ?? []}
        managers={managers ?? []}
        onCancel={() => setModaleEdition(false)}
        submitting={modifierMutation.isPending}
        errorMessage={erreur}
        onSubmit={(values: EmployeFormValues) => {
          modifierMutation
            .mutateAsync({
              nom: values.nom,
              prenom: values.prenom,
              email: values.email || undefined,
              telephone: values.telephone || undefined,
              poste: values.poste || undefined,
              dateEmbauche: values.dateEmbauche.format('YYYY-MM-DD'),
              typeContrat: values.typeContrat,
              dateFinContratPrevue: values.dateFinContratPrevue
                ? values.dateFinContratPrevue.format('YYYY-MM-DD')
                : undefined,
            })
            .then(() => {
              void message.success('Employé modifié')
              setModaleEdition(false)
              setErreur(null)
            })
            .catch((err: ApiError) => setErreur(err.message))
        }}
      />

      <TransfertModal
        open={modaleTransfert}
        departements={departements ?? []}
        managers={managers ?? []}
        submitting={transfererMutation.isPending}
        onCancel={() => setModaleTransfert(false)}
        onSubmit={(valeurs) => {
          transfererMutation
            .mutateAsync(valeurs)
            .then(() => {
              void message.success('Employé transféré')
              setModaleTransfert(false)
              setErreur(null)
            })
            .catch((err: ApiError) => setErreur(err.message))
        }}
      />

      <DesactivationModal
        open={modaleDesactivation}
        submitting={desactiverMutation.isPending}
        onCancel={() => setModaleDesactivation(false)}
        onSubmit={(valeurs) => {
          desactiverMutation
            .mutateAsync(valeurs)
            .then(() => {
              void message.success('Employé désactivé')
              setModaleDesactivation(false)
              setErreur(null)
            })
            .catch((err: ApiError) => setErreur(err.message))
        }}
      />
    </div>
  )
}

function UploadDocument({ onUpload }: { onUpload: (fichier: File, typeDocument: string) => void }) {
  const [typeDocument, setTypeDocument] = useState('autre')
  return (
    <Space>
      <Select
        value={typeDocument}
        onChange={setTypeDocument}
        style={{ width: 160 }}
        options={[
          { label: 'Contrat', value: 'contrat' },
          { label: "Pièce d'identité", value: 'piece_identite' },
          { label: 'Autre', value: 'autre' },
        ]}
      />
      <Upload
        showUploadList={false}
        beforeUpload={(fichier) => {
          onUpload(fichier, typeDocument)
          return false
        }}
      >
        <Button>Ajouter un document</Button>
      </Upload>
    </Space>
  )
}

const schemaTransfert = z.object({
  nouveauDepartementId: z.string().min(1, 'Le département est requis'),
  nouveauManagerId: z.union([z.string().uuid('UUID manager invalide'), z.literal('')]),
  dateEffet: z.instanceof(dayjs as unknown as new (...args: never[]) => Dayjs, {
    message: "La date d'effet est requise",
  }),
})
type ValeursTransfert = z.infer<typeof schemaTransfert>

function TransfertModal({
  open,
  departements,
  managers,
  submitting,
  onCancel,
  onSubmit,
}: {
  open: boolean
  departements: { id?: string; nom?: string }[]
  managers: Manager[]
  submitting: boolean
  onCancel: () => void
  onSubmit: (valeurs: {
    nouveauDepartementId: string
    nouveauManagerId?: string
    dateEffet: string
  }) => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ValeursTransfert>({
    resolver: zodResolver(schemaTransfert),
    defaultValues: { nouveauDepartementId: '', nouveauManagerId: '', dateEffet: dayjs() },
  })

  return (
    <Modal
      title="Transférer l'employé"
      open={open}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="Transférer"
      cancelText="Annuler"
      destroyOnClose
      onOk={handleSubmit((v) =>
        onSubmit({
          nouveauDepartementId: v.nouveauDepartementId,
          nouveauManagerId: v.nouveauManagerId || undefined,
          dateEffet: v.dateEffet.format('YYYY-MM-DD'),
        }),
      )}
    >
      <AntForm layout="vertical">
        <AntForm.Item
          label="Nouveau département"
          validateStatus={errors.nouveauDepartementId ? 'error' : ''}
          help={errors.nouveauDepartementId?.message}
          required
        >
          <Controller
            name="nouveauDepartementId"
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
          label="Nouveau manager"
          validateStatus={errors.nouveauManagerId ? 'error' : ''}
          help={errors.nouveauManagerId?.message}
        >
          <Controller
            name="nouveauManagerId"
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
        <AntForm.Item
          label="Date d'effet"
          validateStatus={errors.dateEffet ? 'error' : ''}
          help={(errors.dateEffet as FieldError | undefined)?.message}
          required
        >
          <Controller
            name="dateEffet"
            control={control}
            render={({ field }) => (
              <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />
            )}
          />
        </AntForm.Item>
      </AntForm>
    </Modal>
  )
}

const schemaDesactivation = z.object({
  motif: z.enum(MOTIFS_DEPART),
  dateDepart: z.instanceof(dayjs as unknown as new (...args: never[]) => Dayjs, {
    message: 'La date de départ est requise',
  }),
})
type ValeursDesactivation = z.infer<typeof schemaDesactivation>

function DesactivationModal({
  open,
  submitting,
  onCancel,
  onSubmit,
}: {
  open: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: (valeurs: { motif: (typeof MOTIFS_DEPART)[number]; dateDepart: string }) => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ValeursDesactivation>({
    resolver: zodResolver(schemaDesactivation),
    defaultValues: { motif: 'demission', dateDepart: dayjs() },
  })

  return (
    <Modal
      title="Désactiver l'employé"
      open={open}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="Désactiver"
      okButtonProps={{ danger: true }}
      cancelText="Annuler"
      destroyOnClose
      onOk={handleSubmit((v) =>
        onSubmit({ motif: v.motif, dateDepart: v.dateDepart.format('YYYY-MM-DD') }),
      )}
    >
      <AntForm layout="vertical">
        <AntForm.Item
          label="Motif"
          validateStatus={errors.motif ? 'error' : ''}
          help={errors.motif?.message}
          required
        >
          <Controller
            name="motif"
            control={control}
            render={({ field }) => (
              <Select {...field} options={MOTIFS_DEPART.map((m) => ({ label: m, value: m }))} />
            )}
          />
        </AntForm.Item>
        <AntForm.Item
          label="Date de départ"
          validateStatus={errors.dateDepart ? 'error' : ''}
          help={(errors.dateDepart as FieldError | undefined)?.message}
          required
        >
          <Controller
            name="dateDepart"
            control={control}
            render={({ field }) => (
              <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" />
            )}
          />
        </AntForm.Item>
      </AntForm>
    </Modal>
  )
}
