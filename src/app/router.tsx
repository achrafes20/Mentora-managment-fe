import type { ReactElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { EmployesPage } from '../features/employee/EmployesPage'
import { AppLayout } from './AppLayout'
import { ModulePlaceholder } from './ModulePlaceholder'
import { modules } from './modules'

// Modules avec un écran réel — le reste retombe sur ModulePlaceholder tant que
// leur tâche n'est pas construite.
const ecransParModule: Partial<Record<string, ReactElement>> = {
  employees: <EmployesPage />,
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ModulePlaceholder label="Bienvenue" /> },
      ...modules.map((m) => ({
        path: m.path.slice(1),
        element: ecransParModule[m.key] ?? <ModulePlaceholder label={m.label} />,
      })),
    ],
  },
])
