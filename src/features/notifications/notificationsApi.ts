import { apiClient } from '@/lib/apiClient'

export const CLE_NOTIFICATIONS = ['notifications'] as const
export const CLE_NOTIFICATIONS_NON_LUES = ['notifications', 'non-lues'] as const

export interface NotificationInApp {
  id: string
  titre: string
  message: string
  module: string | null
  lienAction: string | null
  entiteType: string | null
  entiteId: string | null
  lu: boolean
  luLe: string | null
  mattermostTente: boolean
  mattermostReussi: boolean | null
  creeLe: string
}

export interface PageNotifications {
  content: NotificationInApp[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

interface ApiResponse<T> {
  data: T
}

export async function listerNotifications(page = 0, size = 20): Promise<PageNotifications> {
  const { data } = await apiClient.get<ApiResponse<PageNotifications>>('/api/notifications', {
    params: { page, size },
  })
  return data.data
}

export async function compterNotificationsNonLues(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
    '/api/notifications/non-lues/count',
  )
  return data.data.count
}

export async function marquerNotificationLue(id: string): Promise<NotificationInApp> {
  const { data } = await apiClient.patch<ApiResponse<NotificationInApp>>(
    `/api/notifications/${id}/lire`,
  )
  return data.data
}

export async function marquerToutesNotificationsLues(): Promise<number> {
  const { data } = await apiClient.patch<ApiResponse<{ nombreMisAJour: number }>>(
    '/api/notifications/lire-toutes',
  )
  return data.data.nombreMisAJour
}
