export interface ModuleNavEntry {
  key: string
  label: string
  path: string
  enabled: boolean
}

// Les 10 modules métier du cahier des charges. Toutes désactivées tant
// que le module correspondant n'est pas construit (mis à jour phase après phase).
export const modules: ModuleNavEntry[] = [
  { key: 'auth', label: 'Comptes & authentification', path: '/comptes', enabled: true },
  { key: 'employees', label: 'Employés', path: '/employes', enabled: true },
  { key: 'attendance', label: 'Présence', path: '/presence', enabled: false },
  { key: 'recruitment', label: 'Recrutement', path: '/recrutement', enabled: false },
  { key: 'admin-requests', label: 'Demandes administratives', path: '/demandes', enabled: false },
  { key: 'documents', label: 'Documents RH', path: '/documents', enabled: false },
  { key: 'dashboard', label: 'Tableau de bord', path: '/tableau-de-bord', enabled: false },
  { key: 'exports', label: 'Exports', path: '/exports', enabled: false },
  { key: 'config', label: 'Configuration', path: '/configuration', enabled: false },
  { key: 'notifications', label: 'Notifications', path: '/notifications', enabled: false },
]
