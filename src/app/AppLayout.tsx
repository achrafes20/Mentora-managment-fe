import { Avatar, Button, Layout, Menu, Modal, Typography } from 'antd'
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { modules } from './modules'

const { Sider, Content } = Layout
const { Text } = Typography

/**
 * Layout principal — navigation latérale conforme au design system HB.
 * Palette : Blanc Papier #F7F7F4, Encre Marine #1B2A41, Gris Dossier #D8D4CC.
 * Indicateur actif : Rose Marque (bordure gauche).
 */
export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()

  // Seuls les modules activés sont cliquables (le module Comptes est géré à part via adminItems)
  const navItems = modules
    .filter((m) => m.enabled && m.path !== '/comptes')
    .map((m) => ({
      key: m.path,
      label: m.label,
    }))

  // Entrée "Comptes" visible uniquement pour admin
  const adminItems =
    role === 'admin'
      ? [
          {
            key: '/comptes',
            label: 'Comptes utilisateurs',
            icon: <SettingOutlined />,
          },
        ]
      : []

  function handleLogout() {
    Modal.confirm({
      title: 'Se déconnecter ?',
      content: 'Votre session sera fermée.',
      okText: 'Déconnexion',
      cancelText: 'Annuler',
      okButtonProps: { danger: true, style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: () => signOut(),
    })
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F7F7F4' }}>
      {/* ---- Navigation latérale ---- */}
      <Sider
        width={240}
        style={{
          background: '#F7F7F4',
          borderRight: '1px solid #D8D4CC',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo / Titre */}
          <div
            style={{
              padding: '28px 20px 20px',
              borderBottom: '1px solid #D8D4CC',
            }}
          >
            <Text
              style={{
                display: 'block',
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontWeight: 600,
                fontSize: 17,
                color: '#1B2A41',
                lineHeight: 1.2,
              }}
            >
              HB Développement
            </Text>
            <div
              style={{
                width: 32,
                height: 3,
                background: '#C92B6A',
                borderRadius: 2,
                marginTop: 6,
              }}
            />
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: 'block' }}>
              Mentora — Gestion RH
            </Text>
          </div>

          {/* Menu principal */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={[...navItems, ...adminItems]}
              onClick={({ key }) => navigate(key)}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 14,
              }}
              theme="light"
            />
            {navItems.length === 0 && adminItems.length === 0 && (
              <div style={{ padding: '8px 20px' }}>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  Aucun module activé pour l'instant.
                </Text>
              </div>
            )}
          </div>

          {/* Profil + déconnexion */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #D8D4CC',
              background: '#F7F7F4',
            }}
          >
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ background: '#1B2A41', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <Text
                    ellipsis
                    strong
                    style={{ fontSize: 13, color: '#1B2A41', display: 'block', lineHeight: 1.3 }}
                  >
                    {user.prenom} {user.nom}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>
                    {user.role}
                  </Text>
                </div>
              </div>
            )}
            <Button
              id="logout-btn"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              style={{
                width: '100%',
                borderRadius: 8,
                borderColor: '#D8D4CC',
                color: '#6B7280',
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 13,
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </Sider>

      {/* ---- Contenu principal ---- */}
      <Layout style={{ marginLeft: 240, background: '#F7F7F4' }}>
        <Content
          style={{
            padding: '32px 40px',
            minHeight: '100vh',
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
