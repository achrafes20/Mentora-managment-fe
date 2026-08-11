import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PointagesPage } from './PointagesPage'
import type { PointageReponse } from './api'

function renderPage() {
  return render(
    <MemoryRouter>
      <PointagesPage />
    </MemoryRouter>,
  )
}

const { listerPointagesMock, corrigerPointageMock, exporterPresenceMock } = vi.hoisted(() => ({
  listerPointagesMock: vi.fn(),
  corrigerPointageMock: vi.fn(),
  exporterPresenceMock: vi.fn(),
}))

vi.mock('./api', () => ({
  listerPointages: listerPointagesMock,
  corrigerPointage: corrigerPointageMock,
  exporterPresence: exporterPresenceMock,
}))

vi.mock('../employee/employesApi', () => ({
  listerEmployes: vi.fn().mockResolvedValue({ content: [] }),
}))

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('@/lib/AuthContext', () => ({ useAuth: useAuthMock }))

const pointage: PointageReponse = {
  id: 'pointage-1',
  employeId: 'emp-1',
  typeScan: 'entree',
  horodatage: '2026-01-15T08:45:00Z',
  corrigeManuellement: false,
  motifCorrection: null,
}

describe('PointagesPage', () => {
  beforeEach(() => {
    listerPointagesMock.mockResolvedValue({ content: [pointage], totalElements: 1 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("un Manager voit l'historique sans pouvoir corriger un pointage", async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    renderPage()

    await waitFor(() => expect(screen.getByText('Entrée')).toBeInTheDocument())

    expect(screen.queryByText('Corriger')).not.toBeInTheDocument()
  })

  it('un Admin peut corriger un pointage, ce qui recharge la liste', async () => {
    useAuthMock.mockReturnValue({ role: 'admin' })
    corrigerPointageMock.mockResolvedValue({ ...pointage, corrigeManuellement: true })
    renderPage()

    await waitFor(() => expect(screen.getByText('Entrée')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Corriger/i }))

    const motif = await screen.findByPlaceholderText('Raison de la correction')
    fireEvent.change(motif, { target: { value: 'Oubli de scan' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction' }))

    await waitFor(() =>
      expect(corrigerPointageMock).toHaveBeenCalledWith(
        'pointage-1',
        expect.any(String),
        'Oubli de scan',
      ),
    )
    await waitFor(() => expect(listerPointagesMock).toHaveBeenCalledTimes(2))
  })

  it("l'export lance l'appel avec la période et le format choisis", async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    renderPage()

    await waitFor(() => expect(screen.getByText('Entrée')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Exporter la feuille de présence/i }))
    fireEvent.click(screen.getByText('Excel (.xlsx)'))

    await waitFor(() =>
      expect(exporterPresenceMock).toHaveBeenCalledWith(
        expect.objectContaining({ employeId: undefined }),
        'xlsx',
      ),
    )
  })

  it("affiche un message quand il n'y a aucun pointage", async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    listerPointagesMock.mockResolvedValue({ content: [], totalElements: 0 })
    renderPage()

    await waitFor(() => expect(screen.getByText('Aucun pointage')).toBeInTheDocument())
  })
})
