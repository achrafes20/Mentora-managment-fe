import { useState } from 'react'
import {
  Briefcase,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck2,
  UserCog,
  Users,
  Bell,
} from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/NotifContext'
import { HBLogo } from '@/components/ui/HBLogo'
import { NotifPanel } from '@/components/ui/NotifPanel'
import { ROSE_MARQUE, ROSE_MARQUE_UI } from '@/components/ui/tokens'
import { MonCompteDialog } from '@/features/auth/MonCompteDialog'
import { mainNavItems, adminBottomNavItems } from './modules'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()
  const { unreadCount, togglePanel } = useNotifications()
  const [compteOpen, setCompteOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/employes') {
      return location.pathname === '/employes' || location.pathname.startsWith('/employes/')
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F4]">
      <NotifPanel />
      <aside className="sticky top-0 flex h-screen w-[212px] flex-shrink-0 flex-col border-r border-[#D8D4CC] bg-[#F7F7F4]">
        <div className="border-b border-[#D8D4CC] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1B2A41]">
              <HBLogo size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-snug font-semibold text-[#1B2A41]">
                HB Développement
              </p>
              <p style={{ fontFamily: 'var(--font-code)' }} className="text-[10px] text-[#9CA3AF]">
                {role === 'admin' ? 'Admin RH' : 'Manager'}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
              onClick={togglePanel}
              className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#D8D4CC]/40"
            >
              <Bell size={14} className={unreadCount > 0 ? 'text-[#1B2A41]' : 'text-[#9CA3AF]'} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#C1495A] px-0.5 text-[8px] leading-none font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {mainNavItems
            .filter((item) => !item.adminOnly || role === 'admin')
            .map((item) => {
              const active = isActive(item.path)
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-left transition-colors ${
                    active
                      ? 'font-semibold text-[#1B2A41]'
                      : 'text-[#6B7280] hover:bg-[#D8D4CC]/40 hover:text-[#1B2A41]'
                  }`}
                  style={active ? { backgroundColor: `${ROSE_MARQUE}10` } : {}}
                >
                  {active && (
                    <span
                      className="absolute top-[3px] bottom-[3px] left-0 w-[3px] rounded-r-full"
                      style={{ backgroundColor: ROSE_MARQUE }}
                    />
                  )}
                  <Icon
                    size={14}
                    style={active ? { color: ROSE_MARQUE_UI } : {}}
                    className={!active ? 'text-[#9CA3AF]' : ''}
                  />
                  <span className="text-[12px]">{item.label}</span>
                </button>
              )
            })}
        </nav>

        <div className="border-t border-[#D8D4CC] p-2.5">
          {role === 'admin' &&
            adminBottomNavItems.map((item) => {
              const active = isActive(item.path)
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] transition-colors ${
                    active
                      ? 'font-semibold text-[#1B2A41]'
                      : 'text-[#6B7280] hover:bg-[#D8D4CC]/40 hover:text-[#1B2A41]'
                  }`}
                  style={active ? { backgroundColor: `${ROSE_MARQUE}10` } : {}}
                >
                  {active && (
                    <span
                      className="absolute top-[3px] bottom-[3px] left-0 w-[3px] rounded-r-full"
                      style={{ backgroundColor: ROSE_MARQUE }}
                    />
                  )}
                  <Icon size={13} style={active ? { color: ROSE_MARQUE_UI } : {}} />
                  <span className="text-[12px]">{item.label}</span>
                </button>
              )
            })}
          {user && (
            <button
              type="button"
              onClick={() => setCompteOpen(true)}
              className="mt-0.5 mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-left transition-colors hover:bg-[#D8D4CC]/40"
              title="Modifier mon e-mail ou mon mot de passe"
            >
              <Settings size={13} className="flex-shrink-0 text-[#9CA3AF]" />
              <span className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-[#1B2A41]">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-[10px] text-[#9CA3AF] capitalize">{user.role} · Mon compte</p>
              </span>
            </button>
          )}
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-[#9CA3AF] transition-colors hover:bg-[#C1495A]/8 hover:text-[#C1495A]"
          >
            <LogOut size={13} />
            <span className="text-[12px] font-medium">Se déconnecter</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      <MonCompteDialog open={compteOpen} onClose={() => setCompteOpen(false)} />
    </div>
  )
}

// Re-export icons for modules.ts
export {
  LayoutDashboard,
  Users,
  FolderOpen,
  Clock,
  Briefcase,
  FileText,
  Settings,
  UserCheck2,
  UserCog,
}
