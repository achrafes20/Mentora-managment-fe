import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { listManagers, listUsers, type UserResponse } from './authApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
  setAuthToken: vi.fn(),
}))

const getMock = vi.mocked(apiClient.get)

const manager: UserResponse = {
  id: 'b9adff01-3917-449d-b58e-ef74495f1575',
  email: 'sara.alaoui@hbdev.ma',
  role: 'manager',
  nom: 'Alaoui',
  prenom: 'Sara',
  mattermostUserId: null,
  statut: 'actif',
  creeLe: new Date().toISOString(),
  modifieLe: new Date().toISOString(),
}

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listUsers appelle GET /api/users (historique complet, Admin uniquement)', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [manager] } })

    await expect(listUsers()).resolves.toEqual([manager])
    expect(getMock).toHaveBeenCalledWith('/api/users')
  })

  // EF-AUTH-11/12 : listManagers appelle un endpoint distinct et plus étroit — c'est le seul que
  // le picker manager (transfert employé, assignation d'entretien) doit utiliser, car lui seul
  // reste accessible à un délégué actif (cf. DelegationIntegrationTest côté backend,
  // unDelegueActifPeutListerLesManagersPourUnSelecteurMaisPasLaListeComplete).
  it('listManagers appelle GET /api/users/managers, pas /api/users', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [manager] } })

    await expect(listManagers()).resolves.toEqual([manager])
    expect(getMock).toHaveBeenCalledWith('/api/users/managers')
    expect(getMock).not.toHaveBeenCalledWith('/api/users')
  })
})
