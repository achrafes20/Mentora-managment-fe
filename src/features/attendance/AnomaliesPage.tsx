import { Button, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { listerAnomalies, resoudreAnomalie, type AnomaliePointageReponse } from './api'

const TYPES_LABELS: Record<string, { label: string; color: string }> = {
  retard: { label: 'Retard', color: 'orange' },
  depart_anticipe: { label: 'Départ anticipé', color: 'volcano' },
  absence_checkout: { label: 'Absence checkout', color: 'red' },
  presence_incomplete: { label: 'Présence incomplète', color: 'magenta' },
}

export function AnomaliesPage() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const [data, setData] = useState<AnomaliePointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [filtreResolue, setFiltreResolue] = useState<boolean | undefined>(false)
  const pageSize = 20

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerAnomalies(filtreResolue, page, pageSize)
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      message.error('Erreur au chargement des anomalies')
    } finally {
      setLoading(false)
    }
  }, [page, filtreResolue])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function handleResoudre(id: string) {
    try {
      await resoudreAnomalie(id)
      message.success('Anomalie marquée comme résolue')
      charger()
    } catch {
      message.error('Erreur lors de la résolution')
    }
  }

  const columns: ColumnsType<AnomaliePointageReponse> = [
    {
      title: 'Employé (ID)',
      dataIndex: 'employeId',
      key: 'employeId',
      ellipsis: true,
      render: (v: string) => v.substring(0, 8) + '…',
    },
    {
      title: 'Date',
      dataIndex: 'datePointage',
      key: 'datePointage',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'typeAnomalie',
      key: 'typeAnomalie',
      render: (v: string) => {
        const info = TYPES_LABELS[v] ?? { label: v, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: 'Statut',
      dataIndex: 'resolue',
      key: 'resolue',
      render: (v: boolean) =>
        v ? <Tag color="green">Résolue</Tag> : <Tag color="red">Non résolue</Tag>,
    },
    {
      title: 'Créé le',
      dataIndex: 'creeLe',
      key: 'creeLe',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    ...(estAdmin
      ? [
          {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: AnomaliePointageReponse) =>
              !record.resolue ? (
                <Button type="link" onClick={() => handleResoudre(record.id)}>
                  Marquer résolue
                </Button>
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <span>Filtre :</span>
        <Select
          style={{ width: 200 }}
          value={filtreResolue === undefined ? 'all' : filtreResolue ? 'true' : 'false'}
          onChange={(v) => {
            setPage(0)
            setFiltreResolue(v === 'all' ? undefined : v === 'true')
          }}
          options={[
            { label: 'Toutes', value: 'all' },
            { label: 'Non résolues', value: 'false' },
            { label: 'Résolues', value: 'true' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          onChange: (p) => setPage(p - 1),
          showTotal: (t) => `${t} anomalies`,
        }}
      />
    </Space>
  )
}
