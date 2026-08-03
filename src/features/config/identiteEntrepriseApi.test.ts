import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  modifierIdentiteEntreprise,
  obtenirIdentiteEntreprise,
  televerserLogoEntreprise,
  televerserSignatureEntreprise,
  type IdentiteEntreprise,
} from './identiteEntrepriseApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const putMock = vi.mocked(apiClient.put)
const postMock = vi.mocked(apiClient.post)

const identite: IdentiteEntreprise = {
  id: 'id-1',
  raisonSociale: 'HB Développement',
  adresse: 'Casablanca',
  telephone: '+212600000000',
  email: 'contact@hbdev.ma',
  logoFichierId: undefined,
  modifiePar: undefined,
  modifieLe: new Date().toISOString(),
}

describe('identiteEntrepriseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('recupere l identite via GET /api/config/identite-entreprise', async () => {
    getMock.mockResolvedValueOnce({ data: { data: identite } })

    await expect(obtenirIdentiteEntreprise()).resolves.toEqual(identite)
    expect(getMock).toHaveBeenCalledWith('/api/config/identite-entreprise')
  })

  it('modifie l identite via PUT /api/config/identite-entreprise', async () => {
    const requete = {
      raisonSociale: 'HB Développement',
      adresse: 'Casablanca',
      telephone: '+212600000000',
      email: 'contact@hbdev.ma',
    }
    putMock.mockResolvedValueOnce({ data: { data: identite } })

    await expect(modifierIdentiteEntreprise(requete)).resolves.toEqual(identite)
    expect(putMock).toHaveBeenCalledWith('/api/config/identite-entreprise', requete)
  })

  it('televerse le logo via POST multipart', async () => {
    const miseAJour = { ...identite, logoFichierId: 'fichier-1' }
    postMock.mockResolvedValueOnce({ data: { data: miseAJour } })
    const fichier = new File(['contenu'], 'logo.png', { type: 'image/png' })

    await expect(televerserLogoEntreprise(fichier)).resolves.toEqual(miseAJour)
    expect(postMock).toHaveBeenCalledWith(
      '/api/config/identite-entreprise/logo',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })

  it('televerse la signature via POST multipart', async () => {
    const miseAJour = { ...identite, signatureFichierId: 'fichier-2' }
    postMock.mockResolvedValueOnce({ data: { data: miseAJour } })
    const fichier = new File(['contenu'], 'signature.png', { type: 'image/png' })

    await expect(televerserSignatureEntreprise(fichier)).resolves.toEqual(miseAJour)
    expect(postMock).toHaveBeenCalledWith(
      '/api/config/identite-entreprise/signature',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })
})
