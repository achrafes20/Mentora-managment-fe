import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { MOCK_NOTIFICATIONS, type MockNotification } from './mockData'

interface NotifContextValue {
  notifications: MockNotification[]
  unreadCount: number
  markAllRead: () => void
  togglePanel: () => void
  panelOpen: boolean
  closePanel: () => void
}

const NotifContext = createContext<NotifContextValue | null>(null)

export function NotifProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [panelOpen, setPanelOpen] = useState(false)

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      togglePanel: () => setPanelOpen((v) => !v),
      panelOpen,
      closePanel: () => setPanelOpen(false),
    }),
    [notifications, unreadCount, markAllRead, panelOpen],
  )

  return <NotifContext.Provider value={value}>{children}</NotifContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotifications must be used within NotifProvider')
  return ctx
}
