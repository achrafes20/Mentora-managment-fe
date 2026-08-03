import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { approuverDemande, creerDemande, listerDemandes, rejeterDemande } from './adminRequestsApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)
const patchMock = vi.mocked(apiClient.patch)

describe('adminRequestsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne une page vide (content: []) si data absent, plutot que undefined', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerDemandes({})).resolves.toEqual({ content: [] })
  })

  it('cree une demande via POST avec le corps fourni', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { id: 'demande-1' } } })

    await creerDemande({ employeId: 'emp-1', typeDemande: 'conge', motif: 'Vacances' })

    expect(postMock).toHaveBeenCalledWith('/api/demandes-administratives', {
      employeId: 'emp-1',
      typeDemande: 'conge',
      motif: 'Vacances',
    })
  })

  // Approuver/rejeter sont des transitions d'etat idempotentes -> PATCH, pas POST : une
  // regression silencieuse ici (ex. copier-coller depuis creerDemande) ne serait jamais
  // detectee par le typage, seul un test le verifie.
  it('approuve et rejette via PATCH (pas POST)', async () => {
    patchMock.mockResolvedValue({ data: { data: { id: 'demande-1', statut: 'approuvee' } } })

    await approuverDemande('demande-1')
    expect(patchMock).toHaveBeenCalledWith('/api/demandes-administratives/demande-1/approuver')
    expect(postMock).not.toHaveBeenCalled()

    await rejeterDemande('demande-1')
    expect(patchMock).toHaveBeenCalledWith('/api/demandes-administratives/demande-1/rejeter')
    expect(postMock).not.toHaveBeenCalled()
  })
})
