import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  envoyerDocumentLibre,
  executerSurveillance,
  listerEnvoisDocuments,
  listerSurveillance,
} from './documentsApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)

describe('documentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne un tableau vide si aucun envoi (jamais undefined)', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerEnvoisDocuments('emp-1')).resolves.toEqual([])
  })

  it('liste la file de surveillance sur le bon endpoint', async () => {
    getMock.mockResolvedValueOnce({ data: { data: [] } })

    await listerSurveillance()

    expect(getMock).toHaveBeenCalledWith('/api/documents/surveillance')
  })

  // Le nom de la partie ("file") doit matcher @RequestParam("file") cote backend
  // (DocumentRhController) : un renommage silencieux ici casserait l'upload sans erreur de type.
  it("envoie le document libre sous la partie FormData 'file'", async () => {
    postMock.mockResolvedValueOnce({ data: { data: { id: 'envoi-1' } } })
    const fichier = new File(['contenu'], 'libre.pdf', { type: 'application/pdf' })

    await envoyerDocumentLibre('emp-1', fichier)

    const [url, body, config] = postMock.mock.calls[0]
    expect(url).toBe('/api/documents/employes/emp-1/document-libre')
    expect((body as FormData).get('file')).toBe(fichier)
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  // Le bouton "Forcer execution Cron" doit passer par cet endpoint Bearer-authentifie normal,
  // jamais par /api/internal/surveillance/run (secret partage reserve au cron n8n cote backend).
  it('declenche le balayage manuel sur le bon endpoint, sans en-tete de secret', async () => {
    postMock.mockResolvedValueOnce({ data: {} })

    await executerSurveillance()

    expect(postMock).toHaveBeenCalledWith('/api/documents/surveillance/executer')
  })
})
