import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { rechercherAudit, type PageJournalAudit } from './auditApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)

const page: PageJournalAudit = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  last: true,
}

describe('auditApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne une page vide si data absent', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(rechercherAudit({})).resolves.toEqual(page)
  })

  it('appelle GET /api/audit avec les filtres fournis, en omettant les vides', async () => {
    getMock.mockResolvedValueOnce({ data: { data: page } })

    await rechercherAudit({
      module: 'employe',
      utilisateurId: 'user-1',
      debut: '2026-07-01',
      fin: '2026-07-23',
      recherche: 'Dupont',
      page: 2,
      size: 10,
    })

    expect(getMock).toHaveBeenCalledWith('/api/audit', {
      params: {
        module: 'employe',
        utilisateurId: 'user-1',
        debut: '2026-07-01',
        fin: '2026-07-23',
        recherche: 'Dupont',
        page: 2,
        size: 10,
      },
    })
  })

  it('applique les valeurs par defaut page=0 et size=20', async () => {
    getMock.mockResolvedValueOnce({ data: { data: page } })

    await rechercherAudit({})

    expect(getMock).toHaveBeenCalledWith('/api/audit', {
      params: {
        module: undefined,
        utilisateurId: undefined,
        debut: undefined,
        fin: undefined,
        recherche: undefined,
        page: 0,
        size: 20,
      },
    })
  })
})
