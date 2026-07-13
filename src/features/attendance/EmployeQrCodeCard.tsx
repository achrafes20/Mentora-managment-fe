import { Button, Card, Descriptions, Empty, QRCode, Space, Tag, message } from 'antd'
import { QrcodeOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { genererQrCode, qrCodeActif, type QrCodeReponse } from './api'

interface Props {
  employeId: string
  estAdmin: boolean
}

/** Encart QR code sur la fiche employé — affiche le QR code actif, permet de le générer/régénérer. */
export function EmployeQrCodeCard({ employeId, estAdmin }: Props) {
  const [qr, setQr] = useState<QrCodeReponse | null>(null)
  const [loading, setLoading] = useState(false)

  const charger = useCallback(async () => {
    try {
      const result = await qrCodeActif(employeId)
      setQr(result)
    } catch {
      // ignore
    }
  }, [employeId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function handleGenerer() {
    setLoading(true)
    try {
      const newQr = await genererQrCode(employeId)
      setQr(newQr)
      message.success('QR code généré')
    } catch {
      message.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={
        <Space>
          <QrcodeOutlined />
          QR Code de pointage
        </Space>
      }
      size="small"
      extra={
        estAdmin && (
          <Button icon={<ReloadOutlined />} size="small" onClick={handleGenerer} loading={loading}>
            {qr ? 'Régénérer' : 'Générer'}
          </Button>
        )
      }
    >
      {qr ? (
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <QRCode value={qr.valeur} />
          <Descriptions column={1} size="small" style={{ width: '100%' }}>
            <Descriptions.Item label="Valeur">{qr.valeur}</Descriptions.Item>
            <Descriptions.Item label="Statut">
              {qr.actif ? <Tag color="green">Actif</Tag> : <Tag color="red">Inactif</Tag>}
              {qr.bloque && (
                <Tag color="red" icon={<StopOutlined />}>
                  Bloqué
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Généré le">
              {qr.genereLe ? dayjs(qr.genereLe).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ) : (
        <Empty description="Aucun QR code actif" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
