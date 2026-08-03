import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { listerDepartements } from './api'
import { attacherDocumentEmploye, listerDocumentsEmploye, listerEmployes } from './employesApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)

describe('employesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transmet les filtres tels quels en query params', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { content: [] } } })

    await listerEmployes({ departementId: 'dept-1', recherche: 'Dupont', page: 2, size: 10 })

    expect(getMock).toHaveBeenCalledWith('/api/employes', {
      params: { departementId: 'dept-1', recherche: 'Dupont', page: 2, size: 10 },
    })
  })

  it('retourne un tableau vide si aucun document (jamais undefined)', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerDocumentsEmploye('emp-1')).resolves.toEqual([])
  })

  it('construit le FormData du document avec le fichier et son type', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { id: 'doc-1' } } })
    const fichier = new File(['contenu'], 'contrat.pdf', { type: 'application/pdf' })

    await attacherDocumentEmploye('emp-1', fichier, 'contrat')

    expect(postMock).toHaveBeenCalledTimes(1)
    const [url, body, config] = postMock.mock.calls[0]
    expect(url).toBe('/api/employes/emp-1/documents')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('fichier')).toBe(fichier)
    expect((body as FormData).get('typeDocument')).toBe('contrat')
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })
})

describe('departements api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne un tableau vide si data absent', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerDepartements()).resolves.toEqual([])
  })
})
