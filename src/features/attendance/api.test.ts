import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  creerPlanningTeletravail,
  listerAnomalies,
  listerPointages,
  qrCodeActif,
  scannerKiosque,
  statutActivationAppareil,
  verifierCodeActivation,
} from './api'

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

  it('applique les valeurs par defaut page=0 et size=20 pour les pointages', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { content: [] } } })

    await listerPointages()

    expect(getMock).toHaveBeenCalledWith('/api/pointages', { params: { page: 0, size: 20 } })
  })

  it('omet le filtre resolue quand il est indefini, le transmet sinon', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await listerAnomalies()
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', { params: { page: 0, size: 20 } })

    await listerAnomalies(true, 1, 5)
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', {
      params: { page: 1, size: 5, resolue: true },
    })

    await listerAnomalies(false)
    expect(getMock).toHaveBeenLastCalledWith('/api/anomalies', {
      params: { page: 0, size: 20, resolue: false },
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

  // NFR-UX-02 : jeton d'activation par appareil.
  it("joint le jeton d'appareil en en-tete lors du scan kiosque", async () => {
    postMock.mockResolvedValueOnce({
      data: { data: { id: 'p1', typeScan: 'entree' } },
    })

    await scannerKiosque('qr-123', 'entree', 'jeton-abc')

    expect(postMock).toHaveBeenCalledWith(
      '/api/kiosque/scan',
      { valeurQr: 'qr-123', typeScan: 'entree' },
      { headers: { 'X-Kiosque-Device-Token': 'jeton-abc' } },
    )
  })

  it("ne fait aucun appel et renvoie false si aucun jeton n'est stocke localement", async () => {
    await expect(statutActivationAppareil(null)).resolves.toBe(false)
    expect(getMock).not.toHaveBeenCalled()
  })

  it('interroge le statut avec le jeton en en-tete si present', async () => {
    getMock.mockResolvedValueOnce({ data: { data: { actif: true } } })

    await expect(statutActivationAppareil('jeton-abc')).resolves.toBe(true)
    expect(getMock).toHaveBeenCalledWith('/api/kiosque/activation/statut', {
      headers: { 'X-Kiosque-Device-Token': 'jeton-abc' },
    })
  })

  it("echange un code contre un jeton d'appareil", async () => {
    postMock.mockResolvedValueOnce({ data: { data: { jetonAppareil: 'jeton-xyz' } } })

    await expect(verifierCodeActivation('AB12CD')).resolves.toBe('jeton-xyz')
    expect(postMock).toHaveBeenCalledWith('/api/kiosque/activation/verifier', { code: 'AB12CD' })
  })
})
