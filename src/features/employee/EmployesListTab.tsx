import { Alert, Button, Input, Select, Space, Table, Tag, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import type { ApiError } from '../../lib/apiClient'
import { EmployeFormModal, type EmployeFormValues } from './EmployeFormModal'
import { useDepartements } from './useDepartements'
import { useCreerEmploye, useEmployes } from './useEmployes'
import { useManagers } from './useManagers'
import type { Employe, FiltresEmployes } from './employesApi'

const TYPES_CONTRAT = ['CDI', 'CDD', 'STAGIAIRE', 'STAGIAIRE_REMUNERE']

export function EmployesListTab() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const { data: departements } = useDepartements()
  const { data: managers } = useManagers()
  const [filtres, setFiltres] = useState<FiltresEmployes>({ page: 0, size: 10 })
  const [modaleCreation, setModaleCreation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const { data: page, isLoading, error } = useEmployes(filtres)
  const creerMutation = useCreerEmploye()

  function majFiltre(patch: Partial<FiltresEmployes>) {
    setFiltres((precedent) => ({ ...precedent, ...patch, page: 0 }))
  }

  function creerEmploye(valeurs: EmployeFormValues) {
    creerMutation
      .mutateAsync({
        nom: valeurs.nom,
        prenom: valeurs.prenom,
        email: valeurs.email || undefined,
        telephone: valeurs.telephone || undefined,
        poste: valeurs.poste || undefined,
        departementId: valeurs.departementId,
        managerId: valeurs.managerId || undefined,
        dateEmbauche: valeurs.dateEmbauche.format('YYYY-MM-DD'),
        typeContrat: valeurs.typeContrat,
        dateFinContratPrevue: valeurs.dateFinContratPrevue
          ? valeurs.dateFinContratPrevue.format('YYYY-MM-DD')
          : undefined,
      })
      .then(() => {
        void message.success('Employé créé')
        setModaleCreation(false)
        setErreur(null)
      })
      .catch((err: ApiError) => setErreur(err.message))
  }

  const colonnes = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
    { title: 'Département', dataIndex: 'departementNom', key: 'departementNom' },
    { title: 'Poste', dataIndex: 'poste', key: 'poste' },
    { title: 'Type de contrat', dataIndex: 'typeContrat', key: 'typeContrat' },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut: string) => (
        <Tag color={statut === 'actif' ? 'green' : 'default'}>{statut}</Tag>
      ),
    },
  ]

  return (
    <div>
      {estAdmin && (
        <Space style={{ marginBottom: 16, justifyContent: 'space-between', display: 'flex' }}>
          <Button type="primary" onClick={() => setModaleCreation(true)}>
            + Nouvel employé
          </Button>
        </Space>
      )}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Rechercher par nom, prénom, e-mail"
          allowClear
          style={{ width: 260 }}
          onSearch={(valeur) => majFiltre({ recherche: valeur || undefined })}
        />
        <Select
          placeholder="Département"
          allowClear
          style={{ width: 200 }}
          options={departements?.map((d) => ({ label: d.nom, value: d.id }))}
          onChange={(valeur) => majFiltre({ departementId: valeur })}
        />
        <Select
          placeholder="Type de contrat"
          allowClear
          style={{ width: 180 }}
          options={TYPES_CONTRAT.map((t) => ({ label: t, value: t }))}
          onChange={(valeur) => majFiltre({ typeContrat: valeur })}
        />
        <Select
          placeholder="Statut"
          allowClear
          style={{ width: 140 }}
          options={[
            { label: 'Actif', value: 'actif' },
            { label: 'Inactif', value: 'inactif' },
          ]}
          onChange={(valeur) => majFiltre({ statut: valeur })}
        />
      </Space>
      {error && (
        <Alert
          type="error"
          message="Impossible de charger les employés"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
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
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={page?.content}
        columns={colonnes}
        onRow={(employe: Employe) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/employes/${employe.id}`),
        })}
        pagination={{
          current: (filtres.page ?? 0) + 1,
          pageSize: filtres.size ?? 10,
          total: page?.totalElements,
          onChange: (page, size) =>
            setFiltres((precedent) => ({ ...precedent, page: page - 1, size })),
        }}
      />
      <EmployeFormModal
        open={modaleCreation}
        mode="creation"
        departements={departements ?? []}
        managers={managers ?? []}
        onCancel={() => {
          setModaleCreation(false)
          setErreur(null)
        }}
        onSubmit={creerEmploye}
        submitting={creerMutation.isPending}
        errorMessage={erreur}
      />
    </div>
  )
}
