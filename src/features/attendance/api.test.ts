import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { creerPlanningTeletravail, listerAnomalies, listerPointages, qrCodeActif } from './api'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)

describe('attendance api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applique les valeurs par defaut page=0 et size=20 pour les pointages, sans filtre', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { content: [] } } })

    await listerPointages()

    expect(getMock).toHaveBeenCalledWith('/api/pointages', { params: { page: 0, size: 20 } })
  })

  it('transmet les filtres de pointages renseignes uniquement', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { content: [] } } })

    await listerPointages({ employeId: 'emp-1', typeScan: 'entree' }, 2, 10)

    expect(getMock).toHaveBeenCalledWith('/api/pointages', {
      params: { page: 2, size: 10, employeId: 'emp-1', typeScan: 'entree' },
    })
  })

  it('omet le filtre resolue quand il est indefini, le transmet sinon', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await listerAnomalies()
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', { params: { page: 0, size: 20 } })

    await listerAnomalies({ resolue: true }, 1, 5)
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', {
      params: { page: 1, size: 5, resolue: true },
    })

    await listerAnomalies({ resolue: false })
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', {
      params: { page: 0, size: 20, resolue: false },
    })
  })

  it('transmet les filtres employe/type/periode pour les anomalies', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { content: [] } } })

    await listerAnomalies({
      employeId: 'emp-2',
      type: 'retard',
      debut: '2026-01-01',
      fin: '2026-01-31',
    })

    expect(getMock).toHaveBeenCalledWith('/api/anomalies', {
      params: {
        page: 0,
        size: 20,
        employeId: 'emp-2',
        type: 'retard',
        debut: '2026-01-01',
        fin: '2026-01-31',
      },
    })
  })

  it('retourne null si aucun QR code actif (jamais undefined)', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(qrCodeActif('emp-1')).resolves.toBeNull()
  })

  it('poste le planning teletravail sur le bon employe', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { id: 'planning-1' } } })

    await creerPlanningTeletravail('emp-1', {
      dateDebut: '2026-01-01',
      jours: ['lundi', 'mardi'],
    })

    expect(postMock).toHaveBeenCalledWith('/api/employes/emp-1/teletravail', {
      dateDebut: '2026-01-01',
      jours: ['lundi', 'mardi'],
    })
  })
})
