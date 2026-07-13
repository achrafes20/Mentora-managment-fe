import { useState } from 'react'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  motDePasse: string
}

/**
 * EF-AUTH-01 — Page de connexion.
 * Design : fond Blanc Papier, formulaire centré, sobre et institutionnel.
 * Spec : docs/ui-design/auth-screen.md §1
 */
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<LoginForm>()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  async function handleSubmit(values: LoginForm) {
    setError(null)
    setLocked(false)
    setLoading(true)
    try {
      await signIn(values.email, values.motDePasse)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Identifiant ou mot de passe incorrect.'
      if (msg.toLowerCase().includes('verrouillé')) {
        setLocked(true)
      }
      setError(msg)
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
        {/* Logo / Marque */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-block',
              marginBottom: 8,
              borderBottom: '3px solid #C92B6A',
              paddingBottom: 12,
            }}
          >
            <Title
              level={3}
              style={{
                margin: 0,
                color: '#1B2A41',
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              HB Développement
            </Title>
          </div>
          <Text
            style={{
              display: 'block',
              color: '#6B7280',
              fontSize: 13,
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              marginTop: 4,
            }}
          >
            Plateforme de gestion RH — Mentora
          </Text>
        </div>

        {/* Message verrouillage (EF-AUTH-03) */}
        {locked && (
          <Alert
            type="error"
            style={{ marginBottom: 20, borderRadius: 8 }}
            message="Compte temporairement verrouillé suite à plusieurs tentatives échouées. Réessayez dans quelques minutes, ou contactez un administrateur."
            showIcon
          />
        )}

        {/* Erreur standard */}
        {error && !locked && (
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
                Identifiant (e-mail)
              </Text>
            }
            rules={[
              { required: true, message: "L'adresse e-mail est obligatoire" },
              { type: 'email', message: "Format d'e-mail invalide" },
            ]}
          >
            <Input
              id="login-email"
              prefix={<UserOutlined style={{ color: '#D8D4CC' }} />}
              placeholder="admin@hbdev.ma"
              autoComplete="email"
              style={{ borderRadius: 8, borderColor: '#D8D4CC' }}
            />
          </Form.Item>

          <Form.Item
            name="motDePasse"
            label={
              <Text strong style={{ color: '#1B2A41', fontSize: 14 }}>
                Mot de passe
              </Text>
            }
            rules={[{ required: true, message: 'Le mot de passe est obligatoire' }]}
          >
            <Input.Password
              id="login-password"
              prefix={<LockOutlined style={{ color: '#D8D4CC' }} />}
              placeholder="••••••••••"
              autoComplete="current-password"
              style={{ borderRadius: 8, borderColor: '#D8D4CC' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
            <Button
              id="login-submit"
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
              Se connecter
            </Button>
          </Form.Item>
        </Form>

        {/* Lien mot de passe oublié (EF-AUTH-06) */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/mot-de-passe-oublie"
            style={{
              color: '#4A7C6B',
              fontSize: 14,
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            }}
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  )
}
