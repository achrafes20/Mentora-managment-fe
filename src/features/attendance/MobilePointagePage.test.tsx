import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MobilePointagePage } from './MobilePointagePage'

const {
  statutActivationAppareilMock,
  verifierCodeActivationMock,
  scannerPersonnelMock,
  mesPointagesRecentsMock,
} = vi.hoisted(() => ({
  statutActivationAppareilMock: vi.fn(),
  verifierCodeActivationMock: vi.fn(),
  scannerPersonnelMock: vi.fn(),
  mesPointagesRecentsMock: vi.fn(),
}))

vi.mock('./api', () => ({
  statutActivationAppareil: statutActivationAppareilMock,
  verifierCodeActivation: verifierCodeActivationMock,
  scannerPersonnel: scannerPersonnelMock,
  mesPointagesRecents: mesPointagesRecentsMock,
}))

// html5-qrcode a besoin d'une vraie caméra/DOM que jsdom n'a pas — remplacé par un déclencheur de
// scan manuel (bouton) pour simuler une détection de QR réussie, même principe que
// l'ex-KiosquePage.test.tsx.
vi.mock('./QrScanner', () => ({
  QrScanner: ({ onScan }: { onScan: (valeur: string) => void }) => (
    <button onClick={() => onScan('qr-site-siege')}>Simuler scan</button>
  ),
}))

describe('MobilePointagePage', () => {
  beforeEach(() => {
    localStorage.setItem('hb_pointage_mobile_device_token', 'jeton-test')
    statutActivationAppareilMock.mockResolvedValue(true)
    mesPointagesRecentsMock.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("affiche le prompt d'activation si l'appareil n'a pas de jeton valide", async () => {
    statutActivationAppareilMock.mockResolvedValue(false)
    render(<MobilePointagePage />)

    expect(await screen.findByText('Pointage mobile')).toBeInTheDocument()
  })

  it("scanne le QR de site et affiche la confirmation + met à jour l'historique", async () => {
    scannerPersonnelMock.mockResolvedValue({
      id: 'p1',
      employeId: 'emp-1',
      typeScan: 'entree',
      horodatage: '2026-01-15T08:00:00Z',
      corrigeManuellement: false,
      motifCorrection: null,
    })
    render(<MobilePointagePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Entrée' }))
    fireEvent.click(await screen.findByText('Simuler scan'))

    await waitFor(() =>
      expect(scannerPersonnelMock).toHaveBeenCalledWith('entree', 'qr-site-siege', 'jeton-test'),
    )
    expect(await screen.findByText('Entrée enregistrée')).toBeInTheDocument()
    await waitFor(() => expect(mesPointagesRecentsMock).toHaveBeenCalledTimes(2))
  })

  it('affiche les 5 derniers pointages au chargement', async () => {
    mesPointagesRecentsMock.mockResolvedValue([
      {
        id: 'p1',
        employeId: 'emp-1',
        typeScan: 'sortie',
        horodatage: '2026-01-14T17:00:00Z',
        corrigeManuellement: false,
        motifCorrection: null,
      },
    ])
    render(<MobilePointagePage />)

    expect(await screen.findByText('Mes derniers pointages')).toBeInTheDocument()
    expect(screen.getByText('14/01 18:00')).toBeInTheDocument()
  })

  it('désactive les boutons de pointage hors connexion', async () => {
    const spy = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    render(<MobilePointagePage />)

    expect(await screen.findByText(/Hors connexion/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrée' })).toBeDisabled()
    spy.mockRestore()
  })
})
