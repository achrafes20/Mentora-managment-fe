import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Space,
  Table,
  TimePicker,
  DatePicker,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { creerHoraireReference, listerHorairesReference, type HoraireReferenceReponse } from './api'

export function HorairesReferencePage() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const [data, setData] = useState<HoraireReferenceReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerHorairesReference()
      setData(res)
    } catch {
      message.error('Erreur au chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function handleCreer(values: Record<string, unknown>) {
    try {
      const vals = values as {
        heureDebutMatin: dayjs.Dayjs
        heureFinMatin: dayjs.Dayjs
        heureDebutApresMidi: dayjs.Dayjs
        heureFinApresMidi: dayjs.Dayjs
        toleranceMinutes: number
        dateEffet: dayjs.Dayjs
      }
      await creerHoraireReference({
        heureDebutMatin: vals.heureDebutMatin.format('HH:mm:ss'),
        heureFinMatin: vals.heureFinMatin.format('HH:mm:ss'),
        heureDebutApresMidi: vals.heureDebutApresMidi.format('HH:mm:ss'),
        heureFinApresMidi: vals.heureFinApresMidi.format('HH:mm:ss'),
        toleranceMinutes: vals.toleranceMinutes,
        dateEffet: vals.dateEffet.format('YYYY-MM-DD'),
      })
      message.success('Horaire de référence créé')
      form.resetFields()
      charger()
    } catch {
      message.error('Erreur lors de la création')
    }
  }

  const columns: ColumnsType<HoraireReferenceReponse> = [
    {
      title: "Date d'effet",
      dataIndex: 'dateEffet',
      key: 'dateEffet',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    { title: 'Début matin', dataIndex: 'heureDebutMatin', key: 'heureDebutMatin' },
    { title: 'Fin matin', dataIndex: 'heureFinMatin', key: 'heureFinMatin' },
    { title: 'Début après-midi', dataIndex: 'heureDebutApresMidi', key: 'heureDebutApresMidi' },
    { title: 'Fin après-midi', dataIndex: 'heureFinApresMidi', key: 'heureFinApresMidi' },
    {
      title: 'Tolérance (min)',
      dataIndex: 'toleranceMinutes',
      key: 'toleranceMinutes',
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {estAdmin && (
        <Card title="Nouvel horaire de référence" size="small">
          <Form form={form} layout="inline" onFinish={handleCreer}>
            <Form.Item name="heureDebutMatin" label="Début matin" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="heureFinMatin" label="Fin matin" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="heureDebutApresMidi" label="Début PM" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="heureFinApresMidi" label="Fin PM" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item
              name="toleranceMinutes"
              label="Tolérance"
              rules={[{ required: true }]}
              initialValue={15}
            >
              <InputNumber min={0} max={60} addonAfter="min" />
            </Form.Item>
            <Form.Item name="dateEffet" label="Date d'effet" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Créer
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />
    </Space>
  )
}
