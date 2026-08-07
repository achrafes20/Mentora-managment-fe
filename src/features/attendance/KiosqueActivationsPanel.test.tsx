import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KiosqueActivationsPanel } from './KiosqueActivationsPanel'
import type { KiosqueActivationReponse, SiteQrCodeReponse } from './api'

const {
  listerActivationsKiosqueMock,
  genererCodeActivationPersonnelMock,
  revoquerActivationKiosqueMock,
  listerSitesQrMock,
  genererSiteQrMock,
  desactiverSiteQrMock,
} = vi.hoisted(() => ({
  listerActivationsKiosqueMock: vi.fn(),
  genererCodeActivationPersonnelMock: vi.fn(),
  revoquerActivationKiosqueMock: vi.fn(),
  listerSitesQrMock: vi.fn(),
  genererSiteQrMock: vi.fn(),
  desactiverSiteQrMock: vi.fn(),
}))

vi.mock('./api', () => ({
  listerActivationsKiosque: listerActivationsKiosqueMock,
  genererCodeActivationPersonnel: genererCodeActivationPersonnelMock,
  revoquerActivationKiosque: revoquerActivationKiosqueMock,
  listerSitesQr: listerSitesQrMock,
  genererSiteQr: genererSiteQrMock,
  desactiverSiteQr: desactiverSiteQrMock,
}))

vi.mock('./posterSite', () => ({
  telechargerPosterSite: vi.fn(),
  apercuPosterSite: vi.fn(),
}))

vi.mock('../employee/employesApi', () => ({
  listerEmployes: vi.fn().mockResolvedValue({
    content: [{ id: 'emp-1', prenom: 'Sara', nom: 'Bennani' }],
  }),
}))

const activationPersonnelle: KiosqueActivationReponse = {
  id: 'act-1',
  emisPar: 'admin-1',
  delegationId: null,
  employeId: 'emp-1',
  emisLe: '2026-01-15T08:00:00Z',
  statut: 'active',
  activeeLe: '2026-01-15T08:05:00Z',
  revoqueeLe: null,
  revoqueePar: null,
}

const siteActif: SiteQrCodeReponse = {
  id: 'site-1',
  libelle: 'Siège Tétouan',
  valeur: 'qr-site-siege',
  actif: true,
  creePar: 'admin-1',
  creeLe: '2026-01-01T08:00:00Z',
}

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <KiosqueActivationsPanel />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('KiosqueActivationsPanel', () => {
  beforeEach(() => {
    listerActivationsKiosqueMock.mockResolvedValue([activationPersonnelle])
    listerSitesQrMock.mockResolvedValue([siteActif])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("affiche le nom de l'employé, cliquable vers sa fiche", async () => {
    renderPanel()

    const lien = await screen.findByRole('button', { name: 'Sara Bennani' })
    expect(lien).toBeInTheDocument()
  })

  it('affiche le QR de site actif avec ses actions', async () => {
    renderPanel()

    expect(await screen.findByText('Siège Tétouan')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Régénérer/ }).length).toBeGreaterThan(0)
  })

  it('régénère un code personnel et affiche le nom dans la carte de confirmation', async () => {
    genererCodeActivationPersonnelMock.mockResolvedValue({ id: 'act-2', code: '4821' })
    renderPanel()

    await screen.findByRole('button', { name: 'Sara Bennani' })
    const boutonsRegenerer = screen.getAllByRole('button', { name: /Régénérer/ })
    const boutonLigne = boutonsRegenerer.find((b) => b.closest('tr'))
    if (!boutonLigne) throw new Error('Bouton Régénérer de la ligne introuvable')
    fireEvent.click(boutonLigne)

    await waitFor(() => expect(genererCodeActivationPersonnelMock).toHaveBeenCalled())
    expect(genererCodeActivationPersonnelMock.mock.calls[0][0]).toBe('emp-1')
    expect(await screen.findByText('4821')).toBeInTheDocument()
    expect(screen.getByText("Code d'activation pour Sara Bennani")).toBeInTheDocument()
  })

  it('ferme la carte de code généré au clic sur la croix', async () => {
    genererCodeActivationPersonnelMock.mockResolvedValue({ id: 'act-2', code: '4821' })
    renderPanel()

    await screen.findByRole('button', { name: 'Sara Bennani' })
    const boutonsRegenerer = screen.getAllByRole('button', { name: /Régénérer/ })
    const boutonLigne = boutonsRegenerer.find((b) => b.closest('tr'))
    if (!boutonLigne) throw new Error('Bouton Régénérer de la ligne introuvable')
    fireEvent.click(boutonLigne)
    await screen.findByText('4821')

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByText('4821')).not.toBeInTheDocument()
  })

  it("affiche un message quand il n'y a aucune activation", async () => {
    listerActivationsKiosqueMock.mockResolvedValue([])
    renderPanel()

    expect(await screen.findByText('Aucune activation pour le moment.')).toBeInTheDocument()
  })
})
