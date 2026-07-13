import { Alert, Button, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import type { ApiError } from '../../lib/apiClient'
import type { Departement, DepartementRequete } from './api'
import { DepartementFormModal, type DepartementFormValues } from './DepartementFormModal'
import {
  useActiverDepartement,
  useCreerDepartement,
  useDepartements,
  useDesactiverDepartement,
  useModifierDepartement,
} from './useDepartements'
import { libelleManager, useManagers } from './useManagers'

export function DepartementsTab() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const { data: departements, isLoading, error } = useDepartements()
  const { data: managers } = useManagers()
  const creerMutation = useCreerDepartement()
  const modifierMutation = useModifierDepartement()
  const desactiverMutation = useDesactiverDepartement()
  const activerMutation = useActiverDepartement()

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
      render: (managerId?: string) => {
        const manager = managers?.find((m) => m.id === managerId)
        return manager ? libelleManager(manager) : '—'
      },
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut: string) => (
        <Tag color={statut === 'actif' ? 'green' : 'default'}>{statut}</Tag>
      ),
    },
    ...(estAdmin
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, depart: Departement) => (
              <Space>
                <Button size="small" onClick={() => ouvrirEdition(depart)}>
                  Modifier
                </Button>
                {depart.statut === 'inactif' ? (
                  <Button
                    size="small"
                    onClick={() =>
                      depart.id &&
                      activerMutation.mutate(depart.id, {
                        onError: (err) => void message.error(err.message),
                      })
                    }
                  >
                    Activer
                  </Button>
                ) : (
                  <Popconfirm
                    title="Désactiver ce département ?"
                    description="Bloqué si des employés actifs y sont encore rattachés."
                    okText="Désactiver"
                    cancelText="Annuler"
                    onConfirm={() =>
                      depart.id &&
                      desactiverMutation.mutate(depart.id, {
                        onError: (err) => void message.error(err.message),
                      })
                    }
                  >
                    <Button size="small" danger>
                      Désactiver
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Text type="secondary">
          {departements?.length ?? 0} département(s)
        </Typography.Text>
        {estAdmin && (
          <Button type="primary" onClick={ouvrirCreation}>
            + Nouveau département
          </Button>
        )}
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
        managers={managers ?? []}
        onCancel={fermerModal}
        onSubmit={soumettre}
        submitting={creerMutation.isPending || modifierMutation.isPending}
        errorMessage={erreurFormulaire}
      />
    </div>
  )
}
