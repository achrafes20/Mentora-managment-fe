import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/lib/AuthContext'
import type { RoleUtilisateur } from '@/lib/authApi'

interface RequireAuthProps {
  children: React.ReactNode
  /** Si fourni, seuls les utilisateurs avec ce rôle peuvent accéder */
  requiredRole?: RoleUtilisateur
}

/**
 * Guard de route — redirige vers /login si non authentifié.
 * Si requiredRole est fourni, renvoie 403 si le rôle est insuffisant.
 */
export function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F7F4',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/tableau-de-bord" replace />
  }

  return <>{children}</>
}

/**
 * Guard inverse — redirige vers / si déjà authentifié (ex. page login).
 */
export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F7F4',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/tableau-de-bord" replace />
  }

  return <>{children}</>
}
