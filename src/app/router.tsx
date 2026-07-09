import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ModulePlaceholder } from './ModulePlaceholder'
import { modules } from './modules'
import { RequireAuth, RedirectIfAuth } from '@/lib/RouteGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { UserManagementPage } from '@/features/auth/UserManagementPage'

export const router = createBrowserRouter([
  // ---- Routes publiques (redirige si déjà connecté) ----
  {
    path: '/login',
    element: (
      <RedirectIfAuth>
        <LoginPage />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/mot-de-passe-oublie',
    element: (
      <RedirectIfAuth>
        <ForgotPasswordPage />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/reinitialiser-mot-de-passe',
    element: <ResetPasswordPage />, // accessible même connecté (lien depuis e-mail)
  },

  // ---- Routes protégées (nécessitent authentification) ----
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ModulePlaceholder label="Bienvenue sur Mentora" /> },

      // Gestion des comptes — Admin uniquement
      {
        path: 'comptes',
        element: (
          <RequireAuth requiredRole="admin">
            <UserManagementPage />
          </RequireAuth>
        ),
      },

      // Modules métier (placeholders — activés phase par phase)
      ...modules
        .filter((m) => m.path !== '/comptes')
        .map((m) => ({
          path: m.path.slice(1),
          element: <ModulePlaceholder label={m.label} />,
        })),

      // Fallback 404
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
