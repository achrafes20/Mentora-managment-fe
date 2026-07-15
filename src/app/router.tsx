import { createBrowserRouter, Navigate } from 'react-router-dom'
import { EmployeDetailPage } from '../features/employee/EmployeDetailPage'
import { EmployesPage } from '../features/employee/EmployesPage'
import { DepartementsPage } from '../features/employee/DepartementsPage'
import { AppLayout } from './AppLayout'
import { RequireAuth, RedirectIfAuth } from '@/lib/RouteGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { UserManagementPage } from '@/features/auth/UserManagementPage'
import { KiosquePage } from '../features/attendance/KiosquePage'
import { PresencePage } from '../features/attendance/PresencePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { RecruitmentPage } from '@/features/recruitment/RecruitmentPage'
import { CandidatDetailPage, OffresPage } from '@/features/recruitment/CandidatDetailPage'
import { DemandesPage } from '@/features/admin-requests/DemandesPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { ConfigurationPage, FeriesPage } from '@/features/config/ConfigurationPage'
import { DelegationPage } from '@/features/delegation/DelegationPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { AuditPage } from '@/features/audit/AuditPage'
import { ImportPage } from '@/features/import/ImportPage'

export const router = createBrowserRouter([
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
    element: <ResetPasswordPage />,
  },
  {
    path: '/kiosque',
    element: <KiosquePage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/employes" replace /> },
      { path: 'tableau-de-bord', element: <DashboardPage /> },
      { path: 'employes', element: <EmployesPage /> },
      { path: 'employes/:id', element: <EmployeDetailPage /> },
      { path: 'departements', element: <DepartementsPage /> },
      { path: 'presence', element: <PresencePage /> },
      { path: 'recrutement', element: <RecruitmentPage /> },
      { path: 'recrutement/offres', element: <OffresPage /> },
      { path: 'recrutement/:id', element: <CandidatDetailPage /> },
      { path: 'demandes', element: <DemandesPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'feries', element: <FeriesPage /> },
      {
        path: 'comptes',
        element: (
          <RequireAuth requiredRole="admin">
            <UserManagementPage />
          </RequireAuth>
        ),
      },
      {
        path: 'configuration',
        element: (
          <RequireAuth requiredRole="admin">
            <ConfigurationPage />
          </RequireAuth>
        ),
      },
      {
        path: 'delegation',
        element: (
          <RequireAuth requiredRole="admin">
            <DelegationPage />
          </RequireAuth>
        ),
      },
      {
        path: 'audit',
        element: (
          <RequireAuth requiredRole="admin">
            <AuditPage />
          </RequireAuth>
        ),
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <Navigate to="/tableau-de-bord" replace /> },
    ],
  },
])
