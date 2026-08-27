import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
  UserCheck2,
  UserCog,
  Users,
} from 'lucide-react'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const mainNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', path: '/tableau-de-bord', icon: LayoutDashboard },
  { key: 'employees', label: 'Employés', path: '/employes', icon: Users },
  {
    key: 'departements',
    label: 'Départements',
    path: '/departements',
    icon: FolderOpen,
    adminOnly: true,
  },
  { key: 'attendance', label: 'Présence', path: '/presence', icon: Clock },
  { key: 'recruitment', label: 'Recrutement', path: '/recrutement', icon: Briefcase },
  { key: 'admin-requests', label: 'Demandes', path: '/demandes', icon: FileText },
  { key: 'documents', label: 'Documents RH', path: '/documents', icon: FileText, adminOnly: true },
]

export const adminBottomNavItems: NavItem[] = [
  { key: 'config', label: 'Configuration', path: '/configuration', icon: Settings },
  { key: 'delegation', label: 'Délégation', path: '/delegation', icon: UserCheck2 },
  { key: 'auth', label: 'Comptes utilisateurs', path: '/comptes', icon: UserCog },
]

// Legacy export for tests
export interface ModuleNavEntry {
  key: string
  label: string
  path: string
  enabled: boolean
}

export const modules: ModuleNavEntry[] = [
  ...mainNavItems.map((m) => ({ key: m.key, label: m.label, path: m.path, enabled: true })),
  ...adminBottomNavItems.map((m) => ({ key: m.key, label: m.label, path: m.path, enabled: true })),
  { key: 'notifications', label: 'Notifications', path: '/notifications', enabled: true },
  { key: 'audit', label: "Journal d'audit", path: '/audit', enabled: true },
  { key: 'jours-feries', label: 'Jours fériés', path: '/jours-feries', enabled: true },
  { key: 'import', label: 'Import', path: '/import', enabled: true },
]
