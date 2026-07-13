import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { EmployeDetailPage } from '../features/employee/EmployeDetailPage'
import { EmployesPage } from '../features/employee/EmployesPage'
import { AppLayout } from './AppLayout'
import { ModulePlaceholder } from './ModulePlaceholder'
import { modules } from './modules'
import { RequireAuth, RedirectIfAuth } from '@/lib/RouteGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { UserManagementPage } from '@/features/auth/UserManagementPage'

// Modules avec un écran réel — le reste retombe sur ModulePlaceholder tant que
// leur tâche n'est pas construite.
const ecransParModule: Partial<Record<string, ReactElement>> = {
  employees: <EmployesPage />,
}

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

      { path: 'employes/:id', element: <EmployeDetailPage /> },

      // Modules métier (placeholders — activés phase par phase)
      ...modules
        .filter((m) => m.path !== '/comptes')
        .map((m) => ({
          path: m.path.slice(1),
          element: ecransParModule[m.key] ?? <ModulePlaceholder label={m.label} />,
        })),

      // Fallback 404
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
