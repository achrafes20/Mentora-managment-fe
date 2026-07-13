import { Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { listerPointages, type PointageReponse } from './api'

export function PointagesPage() {
  const [data, setData] = useState<PointageReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerPointages(page, pageSize)
      setData(res.content)
      setTotal(res.totalElements)
    } catch {
      message.error('Erreur au chargement des pointages')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  const columns: ColumnsType<PointageReponse> = [
    {
      title: 'Employé (ID)',
      dataIndex: 'employeId',
      key: 'employeId',
      ellipsis: true,
      render: (v: string) => v.substring(0, 8) + '…',
    },
    {
      title: 'Type',
      dataIndex: 'typeScan',
      key: 'typeScan',
      render: (v: string) =>
        v === 'entree' ? <Tag color="green">Entrée</Tag> : <Tag color="red">Sortie</Tag>,
    },
    {
      title: 'Horodatage',
      dataIndex: 'horodatage',
      key: 'horodatage',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Correction',
      dataIndex: 'corrigeManuellement',
      key: 'corrigeManuellement',
      render: (v: boolean, record: PointageReponse) =>
        v ? (
          <Tag color="orange" title={record.motifCorrection ?? ''}>
            Corrigé
          </Tag>
        ) : (
          <Tag>Original</Tag>
        ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
          showTotal: (t) => `${t} pointages`,
        }}
      />
    </Space>
  )
}
