import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  compterNotificationsNonLues,
  CLE_NOTIFICATIONS,
  CLE_NOTIFICATIONS_NON_LUES,
  listerNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  type NotificationInApp,
} from '@/features/notifications/notificationsApi'
import { useAuth } from './AuthContext'

interface NotifContextValue {
  notifications: NotificationInApp[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
  togglePanel: () => void
  panelOpen: boolean
  closePanel: () => void
}

const NotifContext = createContext<NotifContextValue | null>(null)

export function NotifProvider({ children }: { children: ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: [...CLE_NOTIFICATIONS, user?.id, 'apercu'],
    queryFn: () => listerNotifications(0, 10),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })

  const unreadQuery = useQuery({
    queryKey: [...CLE_NOTIFICATIONS_NON_LUES, user?.id],
    queryFn: compterNotificationsNonLues,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })

  const invalider = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: CLE_NOTIFICATIONS })
  }, [queryClient])

  const markReadMutation = useMutation({
    mutationFn: marquerNotificationLue,
    onSuccess: invalider,
  })

  const markAllReadMutation = useMutation({
    mutationFn: marquerToutesNotificationsLues,
    onSuccess: invalider,
  })

  const notifications = useMemo(
    () => (isAuthenticated ? (notificationsQuery.data?.content ?? []) : []),
    [isAuthenticated, notificationsQuery.data?.content],
  )
  const unreadCount = isAuthenticated ? (unreadQuery.data ?? 0) : 0

  const markRead = useCallback(
    async (id: string) => {
      await markReadMutation.mutateAsync(id)
    },
    [markReadMutation],
  )

  const markAllRead = useCallback(async () => {
    await markAllReadMutation.mutateAsync()
  }, [markAllReadMutation])

  const refresh = useCallback(async () => {
    await invalider()
  }, [invalider])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading: notificationsQuery.isLoading || unreadQuery.isLoading,
      isError: notificationsQuery.isError || unreadQuery.isError,
      markRead,
      markAllRead,
      refresh,
      togglePanel: () => setPanelOpen((v) => !v),
      panelOpen,
      closePanel: () => setPanelOpen(false),
    }),
    [
      notifications,
      unreadCount,
      notificationsQuery.isLoading,
      notificationsQuery.isError,
      unreadQuery.isLoading,
      unreadQuery.isError,
      markRead,
      markAllRead,
      refresh,
      panelOpen,
    ],
  )

  return <NotifContext.Provider value={value}>{children}</NotifContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotifications must be used within NotifProvider')
  return ctx
}
