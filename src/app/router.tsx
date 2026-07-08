import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ModulePlaceholder } from './ModulePlaceholder'
import { modules } from './modules'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ModulePlaceholder label="Bienvenue" /> },
      ...modules.map((m) => ({
        path: m.path.slice(1),
        element: <ModulePlaceholder label={m.label} />,
      })),
    ],
  },
])
