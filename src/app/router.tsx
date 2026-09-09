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
import { MobilePointagePage } from '../features/attendance/MobilePointagePage'
import { RevoquerAppareilPage } from '../features/attendance/RevoquerAppareilPage'
import { PresencePage } from '../features/attendance/PresencePage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { RecruitmentPage } from '@/features/recruitment/RecruitmentPage'
import { CandidatDetailPage } from '@/features/recruitment/CandidatDetailPage'
import { OffresPage } from '@/features/recruitment/OffresPage'
import { OffreDetailPage } from '@/features/recruitment/OffreDetailPage'
import { DemandesPage } from '@/features/admin-requests/DemandesPage'
import { JoursFeriesPage } from '@/features/admin-requests/JoursFeriesPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { ConfigurationPage } from '@/features/config/ConfigurationPage'
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
    path: '/pointage-mobile',
    element: <MobilePointagePage />,
  },
  {
    path: '/pointage-mobile/revoquer',
    element: <RevoquerAppareilPage />,
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
      { path: 'recrutement/offres/:id', element: <OffreDetailPage /> },
      { path: 'recrutement/:id', element: <CandidatDetailPage /> },
      { path: 'demandes', element: <DemandesPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'import', element: <ImportPage /> },
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
      {
        path: 'jours-feries',
        element: (
          <RequireAuth requiredRole="admin">
            <JoursFeriesPage />
          </RequireAuth>
        ),
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <Navigate to="/tableau-de-bord" replace /> },
    ],
  },
])
