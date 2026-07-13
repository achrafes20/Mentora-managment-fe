import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  List,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd'
import { CalendarOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  creerPlanningTeletravail,
  listerPlanningsTeletravail,
  supprimerPlanningTeletravail,
  type PlanningTeletravailReponse,
} from './api'

const JOURS_SEMAINE = [
  { label: 'Lun', value: 'lundi' },
  { label: 'Mar', value: 'mardi' },
  { label: 'Mer', value: 'mercredi' },
  { label: 'Jeu', value: 'jeudi' },
  { label: 'Ven', value: 'vendredi' },
]

const JOURS_LABELS: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
}

interface Props {
  employeId: string
  estAdmin: boolean
}

/**
 * Encart planning télétravail sur la fiche employé.
 * - Manager : lecture seule (EF-ATT-10)
 * - Admin : CRUD complet (EF-ATT-08)
 */
export function EmployeTeletravailCard({ employeId, estAdmin }: Props) {
  const [plannings, setPlannings] = useState<PlanningTeletravailReponse[]>([])
  const [loading, setLoading] = useState(false)
  const [ajoutVisible, setAjoutVisible] = useState(false)
  const [dateDebut, setDateDebut] = useState<dayjs.Dayjs | null>(null)
  const [dateFin, setDateFin] = useState<dayjs.Dayjs | null>(null)
  const [joursChoisis, setJoursChoisis] = useState<string[]>([])

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listerPlanningsTeletravail(employeId)
      setPlannings(res)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [employeId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function handleCreer() {
    if (!dateDebut || joursChoisis.length === 0) {
      message.warning('Date de début et au moins un jour requis')
      return
    }
    try {
      await creerPlanningTeletravail(employeId, {
        dateDebut: dateDebut.format('YYYY-MM-DD'),
        dateFin: dateFin?.format('YYYY-MM-DD'),
        jours: joursChoisis,
      })
      message.success('Planning créé')
      setAjoutVisible(false)
      setDateDebut(null)
      setDateFin(null)
      setJoursChoisis([])
      charger()
    } catch {
      message.error('Erreur lors de la création')
    }
  }

  async function handleSupprimer(planningId: string) {
    try {
      await supprimerPlanningTeletravail(employeId, planningId)
      message.success('Planning supprimé')
      charger()
    } catch {
      message.error('Erreur lors de la suppression')
    }
  }

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          Planning télétravail
        </Space>
      }
      size="small"
      extra={
        estAdmin &&
        !ajoutVisible && (
          <Button icon={<PlusOutlined />} size="small" onClick={() => setAjoutVisible(true)}>
            Ajouter
          </Button>
        )
      }
    >
      {ajoutVisible && estAdmin && (
        <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <DatePicker
                placeholder="Date début"
                value={dateDebut}
                onChange={setDateDebut}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Date fin (optionnel)"
                value={dateFin}
                onChange={setDateFin}
                format="DD/MM/YYYY"
              />
            </Space>
            <Checkbox.Group
              options={JOURS_SEMAINE}
              value={joursChoisis}
              onChange={(v) => setJoursChoisis(v as string[])}
            />
            <Space>
              <Button type="primary" size="small" onClick={handleCreer}>
                Valider
              </Button>
              <Button size="small" onClick={() => setAjoutVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {plannings.length > 0 ? (
        <List
          loading={loading}
          dataSource={plannings}
          renderItem={(p) => (
            <List.Item
              actions={
                estAdmin
                  ? [
                      <Popconfirm
                        key="del"
                        title="Supprimer ce planning ?"
                        onConfirm={() => handleSupprimer(p.id)}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                title={
                  <Space>
                    {dayjs(p.dateDebut).format('DD/MM/YYYY')}→
                    {p.dateFin ? dayjs(p.dateFin).format('DD/MM/YYYY') : 'Indéfini'}
                  </Space>
                }
                description={
                  <Space>
                    {p.jours.map((j) => (
                      <Tag key={j} color="blue">
                        {JOURS_LABELS[j] ?? j}
                      </Tag>
                    ))}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Aucun planning de télétravail" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
