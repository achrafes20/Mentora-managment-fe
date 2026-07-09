import { useState } from 'react'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/lib/authApi'

const { Title, Text, Paragraph } = Typography

interface ForgotForm {
  email: string
}

/**
 * EF-AUTH-06 — Demande de réinitialisation de mot de passe.
 * Spec : docs/ui-design/design-system-specs.md §1.1
 */
export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<ForgotForm>()

  async function handleSubmit(values: ForgotForm) {
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(values.email)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessayez dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F7F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          borderRadius: 12,
          padding: '48px 40px 40px',
          boxShadow: '0 1px 4px rgba(27,42,65,0.08), 0 4px 20px rgba(27,42,65,0.06)',
          border: '1px solid #D8D4CC',
        }}
      >
        {/* En-tête */}
        <div style={{ marginBottom: 32 }}>
          <Title
            level={4}
            style={{
              margin: '0 0 8px',
              color: '#1B2A41',
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontWeight: 600,
            }}
          >
            Réinitialiser le mot de passe
          </Title>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Saisissez votre adresse e-mail. Si un compte correspond, vous recevrez un lien de
            réinitialisation.
          </Text>
        </div>

        {/* Confirmation après envoi */}
        {sent ? (
          <div>
            <Alert
              type="success"
              style={{ borderRadius: 8, marginBottom: 24 }}
              message="Si un compte correspond à ces informations, un e-mail a été envoyé."
              showIcon
            />
            <Paragraph style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>
              Vérifiez votre boîte de réception et cliquez sur le lien reçu. Il est valable 1 heure.
            </Paragraph>
            <Link to="/login">
              <Button
                icon={<ArrowLeftOutlined />}
                style={{ borderRadius: 8, borderColor: '#D8D4CC', color: '#1B2A41' }}
              >
                Retour à la connexion
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <Alert
                type="error"
                style={{ marginBottom: 20, borderRadius: 8 }}
                message={error}
                showIcon
              />
            )}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="email"
                label={
                  <Text strong style={{ color: '#1B2A41', fontSize: 14 }}>
                    Identifiant ou e-mail
                  </Text>
                }
                rules={[
                  { required: true, message: "L'adresse e-mail est obligatoire" },
                  { type: 'email', message: "Format d'e-mail invalide" },
                ]}
              >
                <Input
                  id="forgot-email"
                  prefix={<MailOutlined style={{ color: '#D8D4CC' }} />}
                  placeholder="admin@hbdev.ma"
                  autoComplete="email"
                  style={{ borderRadius: 8, borderColor: '#D8D4CC' }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
                <Button
                  id="forgot-submit"
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: 44,
                    borderRadius: 8,
                    background: '#1B2A41',
                    borderColor: '#1B2A41',
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  Envoyer le lien de réinitialisation
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                style={{
                  color: '#4A7C6B',
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                }}
              >
                <ArrowLeftOutlined style={{ marginRight: 4 }} />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
