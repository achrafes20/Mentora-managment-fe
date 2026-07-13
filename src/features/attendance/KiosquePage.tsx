import { Button, Card, message, Result, Space, Typography } from 'antd'
import { useState } from 'react'
import {
  LoginOutlined,
  LogoutOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons'
import { scannerKiosque, type PointageReponse } from './api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

/**
 * Page Kiosque publique — accessible sans authentification (EF-ATT-02).
 * Simule un scan QR en saisissant la valeur dans un champ texte.
 */
export function KiosquePage() {
  const [valeurQr, setValeurQr] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<PointageReponse | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function scanner(typeScan: 'entree' | 'sortie') {
    if (!valeurQr.trim()) {
      message.warning('Veuillez scanner ou saisir un QR code')
      return
    }
    setLoading(true)
    setResultat(null)
    setErreur(null)
    try {
      const pointage = await scannerKiosque(valeurQr.trim(), typeScan)
      setResultat(pointage)
      setValeurQr('')
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      setErreur(apiErr?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        styles={{ body: { padding: 32 } }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            🕐 Kiosque de pointage
          </Title>
          <Text type="secondary">Scannez votre QR code puis appuyez sur Entrée ou Sortie</Text>

          <input
            type="text"
            value={valeurQr}
            onChange={(e) => {
              setValeurQr(e.target.value)
              setResultat(null)
              setErreur(null)
            }}
            placeholder="Valeur du QR code…"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '2px solid #d9d9d9',
              borderRadius: 8,
              outline: 'none',
              textAlign: 'center',
              letterSpacing: 2,
            }}
          />

          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              loading={loading}
              onClick={() => scanner('entree')}
              style={{ minWidth: 140, background: '#52c41a', borderColor: '#52c41a' }}
            >
              Entrée
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<LogoutOutlined />}
              loading={loading}
              onClick={() => scanner('sortie')}
              style={{ minWidth: 140 }}
              danger
            >
              Sortie
            </Button>
          </Space>

          {resultat && (
            <Result
              icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
              title={
                resultat.typeScan === 'entree' ? 'Entrée enregistrée ✓' : 'Sortie enregistrée ✓'
              }
              subTitle={`${dayjs(resultat.horodatage).format('HH:mm:ss — DD/MM/YYYY')}`}
              style={{ padding: '16px 0' }}
            />
          )}
          {erreur && (
            <Result
              icon={<CloseCircleFilled style={{ color: '#ff4d4f' }} />}
              title="Erreur"
              subTitle={erreur}
              style={{ padding: '16px 0' }}
            />
          )}
        </Space>
      </Card>
    </div>
  )
}
