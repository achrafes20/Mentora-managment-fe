import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KiosquePage } from './KiosquePage'
import type { PointageReponse } from './api'

const { scannerKiosqueMock, statutActivationAppareilMock } = vi.hoisted(() => ({
  scannerKiosqueMock: vi.fn(),
  statutActivationAppareilMock: vi.fn(),
}))
vi.mock('./api', () => ({
  scannerKiosque: scannerKiosqueMock,
  statutActivationAppareil: statutActivationAppareilMock,
}))

// La caméra réelle (getUserMedia) n'existe pas en jsdom — on isole KiosquePage de QrScanner et on
// expose juste ses props pour simuler un scan détecté ou une erreur caméra.
const { onScanRef, onErreurRef } = vi.hoisted(() => ({
  onScanRef: { current: null as ((valeur: string) => void) | null },
  onErreurRef: { current: null as ((msg: string) => void) | null },
}))
vi.mock('./QrScanner', () => ({
  QrScanner: ({
    onScan,
    onErreur,
  }: {
    onScan: (valeur: string) => void
    onErreur: (msg: string) => void
  }) => {
    onScanRef.current = onScan
    onErreurRef.current = onErreur
    return <div data-testid="qr-scanner-stub" />
  },
}))

const pointage: PointageReponse = {
  id: 'pointage-1',
  employeId: 'emp-1',
  typeScan: 'entree',
  horodatage: '2026-01-15T08:30:00Z',
  corrigeManuellement: false,
  motifCorrection: null,
}

describe('KiosquePage', () => {
  beforeEach(() => {
    onScanRef.current = null
    onErreurRef.current = null
    // NFR-UX-02 : appareil déjà activé — l'écran de scan s'affiche directement, sans passer par
    // KiosqueActivationPrompt (couvert séparément, pas l'objet de cette suite).
    localStorage.setItem('hb_kiosque_device_token', 'jeton-test')
    statutActivationAppareilMock.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('en saisie manuelle, la touche Entrée déclenche un scan "entree" et affiche le résultat', async () => {
    scannerKiosqueMock.mockResolvedValue(pointage)
    render(<KiosquePage />)

    fireEvent.click(await screen.findByRole('button', { name: /Saisie manuelle/i }))
    const champ = screen.getByPlaceholderText('Valeur du QR code…')
    fireEvent.change(champ, { target: { value: 'QR-42' } })
    fireEvent.keyDown(champ, { key: 'Enter' })

    await waitFor(() =>
      expect(scannerKiosqueMock).toHaveBeenCalledWith('QR-42', 'entree', 'jeton-test'),
    )
    expect(await screen.findByText('Entrée enregistrée')).toBeInTheDocument()
  })

  it("affiche le message d'erreur renvoyé par le backend", async () => {
    scannerKiosqueMock.mockRejectedValue({ message: 'QR code invalide ou inactif' })
    render(<KiosquePage />)

    fireEvent.click(await screen.findByRole('button', { name: /Saisie manuelle/i }))
    const champ = screen.getByPlaceholderText('Valeur du QR code…')
    fireEvent.change(champ, { target: { value: 'QR-INVALIDE' } })
    fireEvent.keyDown(champ, { key: 'Enter' })

    expect(await screen.findByText('QR code invalide ou inactif')).toBeInTheDocument()
  })

  it('en mode caméra, choisir "Sortie" active le scanner puis un scan détecté envoie le bon type', async () => {
    scannerKiosqueMock.mockResolvedValue({ ...pointage, typeScan: 'sortie' })
    render(<KiosquePage />)

    fireEvent.click(await screen.findByRole('button', { name: /^Sortie$/i }))
    expect(await screen.findByTestId('qr-scanner-stub')).toBeInTheDocument()

    expect(onScanRef.current).not.toBeNull()
    onScanRef.current?.('QR-99')

    await waitFor(() =>
      expect(scannerKiosqueMock).toHaveBeenCalledWith('QR-99', 'sortie', 'jeton-test'),
    )
    expect(await screen.findByText('Sortie enregistrée')).toBeInTheDocument()
  })

  it('une erreur caméra masque le scanner et affiche le message', async () => {
    render(<KiosquePage />)

    fireEvent.click(await screen.findByRole('button', { name: /^Entrée$/i }))
    expect(await screen.findByTestId('qr-scanner-stub')).toBeInTheDocument()

    onErreurRef.current?.('Accès à la caméra refusé')

    expect(await screen.findByText('Accès à la caméra refusé')).toBeInTheDocument()
    expect(screen.queryByTestId('qr-scanner-stub')).not.toBeInTheDocument()
  })
})
