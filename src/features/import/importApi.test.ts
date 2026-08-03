import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { analyserImport, previsualiserImport } from './importApi'

// jsdom's Blob shim (as returned by FormData.get()) doesn't implement .text()/.arrayBuffer() —
// FileReader is the portable way to read its content back out in this test environment.
function lireBlobEnTexte(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

const postMock = vi.mocked(apiClient.post)

describe('importApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('previsualiserImport envoie le fichier en FormData avec la cible en query param', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { colonnes: [] } } })
    const fichier = new File(['a,b'], 'employes.csv', { type: 'text/csv' })

    await previsualiserImport(fichier, 'EMPLOYES')

    const [url, body, config] = postMock.mock.calls[0]
    expect(url).toBe('/api/import/previsualiser')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('fichier')).toBe(fichier)
    expect(config).toEqual({
      params: { cible: 'EMPLOYES' },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('analyserImport joint le mapping en tant que partie JSON du FormData', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { lignes: [] } } })
    const fichier = new File(['a,b'], 'employes.csv', { type: 'text/csv' })

    await analyserImport(fichier, 'EMPLOYES', { nom: 0, prenom: 1 })

    const [, body] = postMock.mock.calls[0]
    const mappingPart = (body as FormData).get('mapping')
    expect(mappingPart).toBeInstanceOf(Blob)
    expect((mappingPart as Blob).type).toBe('application/json')
    const texte = await lireBlobEnTexte(mappingPart as Blob)
    expect(JSON.parse(texte)).toEqual({ nom: 0, prenom: 1 })
  })
})
