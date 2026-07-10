import { Alert, Button, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import type { ApiError } from '../../lib/apiClient'
import type { Departement, DepartementRequete } from './api'
import { DepartementFormModal, type DepartementFormValues } from './DepartementFormModal'
import {
  useCreerDepartement,
  useDepartements,
  useDesactiverDepartement,
  useModifierDepartement,
} from './useDepartements'

export function DepartementsTab() {
  const { data: departements, isLoading, error } = useDepartements()
  const creerMutation = useCreerDepartement()
  const modifierMutation = useModifierDepartement()
  const desactiverMutation = useDesactiverDepartement()

  const [modalOuvert, setModalOuvert] = useState(false)
  const [departementEnEdition, setDepartementEnEdition] = useState<Departement | null>(null)
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null)

  function ouvrirCreation() {
    setDepartementEnEdition(null)
    setErreurFormulaire(null)
    setModalOuvert(true)
  }

  function ouvrirEdition(depart: Departement) {
    setDepartementEnEdition(depart)
    setErreurFormulaire(null)
    setModalOuvert(true)
  }

  function fermerModal() {
    setModalOuvert(false)
    setErreurFormulaire(null)
  }

  function soumettre(values: DepartementFormValues) {
    const requete: DepartementRequete = {
      nom: values.nom,
      managerId: values.managerId || undefined,
    }
    const promesse = departementEnEdition
      ? modifierMutation.mutateAsync({ id: departementEnEdition.id as string, requete })
      : creerMutation.mutateAsync(requete)

    promesse
      .then(() => {
        void message.success(departementEnEdition ? 'Département modifié' : 'Département créé')
        fermerModal()
      })
      .catch((err: ApiError) => setErreurFormulaire(err.message))
  }

  const colonnes = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Manager',
      dataIndex: 'managerId',
      key: 'managerId',
      render: (managerId?: string) => managerId ?? '—',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut: string) => (
        <Tag color={statut === 'actif' ? 'green' : 'default'}>{statut}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, depart: Departement) => (
        <Space>
          <Button size="small" onClick={() => ouvrirEdition(depart)}>
            Modifier
          </Button>
          <Popconfirm
            title="Désactiver ce département ?"
            description="Le blocage si des employés actifs y sont rattachés arrive avec le module Employés (T1.B2)."
            okText="Désactiver"
            cancelText="Annuler"
            disabled={depart.statut === 'inactif'}
            onConfirm={() => depart.id && desactiverMutation.mutate(depart.id)}
          >
            <Button size="small" danger disabled={depart.statut === 'inactif'}>
              Désactiver
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Text type="secondary">
          {departements?.length ?? 0} département(s)
        </Typography.Text>
        <Button type="primary" onClick={ouvrirCreation}>
          + Nouveau département
        </Button>
      </Space>
      {error && (
        <Alert
          type="error"
          message="Impossible de charger les départements"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={departements}
        columns={colonnes}
        pagination={{ pageSize: 10 }}
      />
      <DepartementFormModal
        open={modalOuvert}
        depart={departementEnEdition}
        onCancel={fermerModal}
        onSubmit={soumettre}
        submitting={creerMutation.isPending || modifierMutation.isPending}
        errorMessage={erreurFormulaire}
      />
    </div>
  )
}
