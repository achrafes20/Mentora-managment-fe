import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  compterNotificationsNonLues,
  listerNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} from './notificationsApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const patchMock = vi.mocked(apiClient.patch)

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('liste une page de notifications', async () => {
    const page = {
      content: [],
      page: 1,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
    getMock.mockResolvedValueOnce({ data: { data: page } })

    await expect(listerNotifications(1, 20)).resolves.toEqual(page)
    expect(getMock).toHaveBeenCalledWith('/api/notifications', {
      params: { page: 1, size: 20 },
    })
  })

  it('recupere le compteur non lu', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { count: 7 } } })

    await expect(compterNotificationsNonLues()).resolves.toBe(7)
    expect(getMock).toHaveBeenCalledWith('/api/notifications/non-lues/count')
  })

  it('marque une notification comme lue', async () => {
    const notification = { id: 'notif-1', lu: true }
    patchMock.mockResolvedValueOnce({ data: { data: notification } })

    await expect(marquerNotificationLue('notif-1')).resolves.toEqual(notification)
    expect(patchMock).toHaveBeenCalledWith('/api/notifications/notif-1/lire')
  })

  it('marque toutes les notifications comme lues', async () => {
    patchMock.mockResolvedValueOnce({ data: { data: { nombreMisAJour: 4 } } })

    await expect(marquerToutesNotificationsLues()).resolves.toBe(4)
    expect(patchMock).toHaveBeenCalledWith('/api/notifications/lire-toutes')
  })
})
