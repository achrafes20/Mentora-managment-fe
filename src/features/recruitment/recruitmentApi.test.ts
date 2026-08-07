import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { listerEntretiens, listerOffres } from './recruitmentApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)

describe('recruitmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("n'envoie aucun param quand aucun statut n'est fourni", async () => {
    getMock.mockResolvedValueOnce({ data: { data: [] } })

    await listerOffres()

    expect(getMock).toHaveBeenCalledWith('/api/offres', {
      params: { statut: undefined, categorie: undefined },
    })
  })

  it('transmet le statut fourni en query param', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [] } })

    await listerOffres('ouverte')

    expect(getMock).toHaveBeenCalledWith('/api/offres', {
      params: { statut: 'ouverte', categorie: undefined },
    })
  })

  it('retourne un tableau vide si aucun entretien (jamais undefined)', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerEntretiens('cand-1')).resolves.toEqual([])
  })
})
