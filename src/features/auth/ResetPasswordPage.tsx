import { useEffect, useState } from 'react'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/lib/authApi'

const { Title, Text } = Typography

interface ResetForm {
  nouveauMotDePasse: string
  confirmation: string
}

/** Critères de politique de mot de passe (NFR-SEC-08) */
function PasswordCriteria({ password }: { password: string }) {
  const criteria = [
    { label: '10 caractères minimum', ok: password.length >= 10 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Une minuscule', ok: /[a-z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
  ]

  return (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      {criteria.map(({ label, ok }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            fontSize: 13,
            color: ok ? '#4A7C6B' : '#6B7280',
          }}
        >
          {ok ? (
            <CheckCircleOutlined style={{ color: '#4A7C6B' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#D8D4CC' }} />
          )}
          {label}
        </div>
      ))}
    </div>
  )
}

/**
 * EF-AUTH-07/08 — Réinitialisation effective du mot de passe.
 * Accessible via le lien e-mail : /reinitialiser-mot-de-passe?token=XXX
 * Spec : docs/ui-design/design-system-specs.md §1.2
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [form] = Form.useForm<ResetForm>()

  useEffect(() => {
    if (!token) {
      setTimeout(
        () => setError('Lien invalide ou expiré. Demandez une nouvelle réinitialisation.'),
        0,
      )
    }
  }, [token])

  async function handleSubmit(values: ResetForm) {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      await resetPassword(token, values.nouveauMotDePasse)
      setSuccess(true)
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          'Lien invalide ou expiré. Demandez une nouvelle réinitialisation.',
      )
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
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 12,
          padding: '48px 40px 40px',
          boxShadow: '0 1px 4px rgba(27,42,65,0.08), 0 4px 20px rgba(27,42,65,0.06)',
          border: '1px solid #D8D4CC',
        }}
      >
        <Title
          level={4}
          style={{
            margin: '0 0 8px',
            color: '#1B2A41',
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontWeight: 600,
          }}
        >
          Nouveau mot de passe
        </Title>
        <Text style={{ color: '#6B7280', fontSize: 14, display: 'block', marginBottom: 32 }}>
          Choisissez un mot de passe sécurisé pour votre compte.
        </Text>

        {success ? (
          <div>
            <Alert
              type="success"
              style={{ borderRadius: 8, marginBottom: 24 }}
              message="Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter."
              showIcon
            />
            <Button
              type="primary"
              block
              onClick={() => navigate('/login')}
              style={{
                height: 44,
                borderRadius: 8,
                background: '#1B2A41',
                borderColor: '#1B2A41',
              }}
            >
              Se connecter
            </Button>
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
            {!token ? null : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                size="large"
              >
                <Form.Item
                  name="nouveauMotDePasse"
                  label={
                    <Text strong style={{ color: '#1B2A41', fontSize: 14 }}>
                      Nouveau mot de passe
                    </Text>
                  }
                  rules={[{ required: true, message: 'Le mot de passe est obligatoire' }]}
                >
                  <Input.Password
                    id="reset-password"
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    style={{ borderRadius: 8, borderColor: '#D8D4CC' }}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>

                {/* Critères visuels en temps réel */}
                <PasswordCriteria password={password} />

                <Form.Item
                  name="confirmation"
                  label={
                    <Text strong style={{ color: '#1B2A41', fontSize: 14 }}>
                      Confirmer le mot de passe
                    </Text>
                  }
                  dependencies={['nouveauMotDePasse']}
                  rules={[
                    { required: true, message: 'La confirmation est obligatoire' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('nouveauMotDePasse') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('Les mots de passe ne correspondent pas.'))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    id="reset-confirm"
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    style={{ borderRadius: 8, borderColor: '#D8D4CC' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
                  <Button
                    id="reset-submit"
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
                    Réinitialiser
                  </Button>
                </Form.Item>
              </Form>
            )}

            <div style={{ textAlign: 'center' }}>
              <Link to="/mot-de-passe-oublie" style={{ color: '#4A7C6B', fontSize: 13 }}>
                Demander un nouveau lien
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
