import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnomaliesPage } from './AnomaliesPage'
import type { AnomaliePointageReponse } from './api'

const { listerAnomaliesMock, resoudreAnomalieMock, obtenirPolitiqueAnomaliesMock } = vi.hoisted(
  () => ({
    listerAnomaliesMock: vi.fn(),
    resoudreAnomalieMock: vi.fn(),
    obtenirPolitiqueAnomaliesMock: vi.fn(),
  }),
)

vi.mock('./api', () => ({
  listerAnomalies: listerAnomaliesMock,
  resoudreAnomalie: resoudreAnomalieMock,
  obtenirPolitiqueAnomalies: obtenirPolitiqueAnomaliesMock,
  modifierPolitiqueAnomalies: vi.fn(),
}))

vi.mock('../employee/employesApi', () => ({
  listerEmployes: vi.fn().mockResolvedValue({ content: [] }),
}))

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('@/lib/AuthContext', () => ({ useAuth: useAuthMock }))

const anomalie: AnomaliePointageReponse = {
  id: 'anomalie-1',
  employeId: 'emp-1',
  datePointage: '2026-01-15',
  typeAnomalie: 'retard',
  resolue: false,
  creeLe: '2026-01-15T09:10:00Z',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AnomaliesPage />
    </QueryClientProvider>,
  )
}

describe('AnomaliesPage', () => {
  beforeEach(() => {
    listerAnomaliesMock.mockResolvedValue({ content: [anomalie], totalElements: 1 })
    obtenirPolitiqueAnomaliesMock.mockResolvedValue({
      id: 'politique-1',
      seuilAnomalies: 3,
      periodeJours: 30,
      modifieLe: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('un Manager voit la liste sans pouvoir marquer une anomalie résolue', async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    renderPage()

    await waitFor(() => expect(screen.getByText('Retard')).toBeInTheDocument())

    expect(screen.queryByText('Marquer résolue')).not.toBeInTheDocument()
    expect(screen.queryByText("Seuil d'anomalies non résolues")).not.toBeInTheDocument()
  })

  it('un Admin peut marquer une anomalie résolue, ce qui recharge la liste', async () => {
    useAuthMock.mockReturnValue({ role: 'admin' })
    resoudreAnomalieMock.mockResolvedValue({ ...anomalie, resolue: true })
    renderPage()

    await waitFor(() => expect(screen.getAllByText('Retard').length).toBeGreaterThan(0))
    const ligne = screen.getByRole('row', { name: /Retard/ })
    expect(ligne).not.toBeNull()

    fireEvent.click(within(ligne as HTMLElement).getByText('Marquer résolue'))

    await waitFor(() => expect(resoudreAnomalieMock).toHaveBeenCalledWith('anomalie-1'))
    expect(listerAnomaliesMock).toHaveBeenCalledTimes(2)
  })

  it('le filtre "Résolues" relance le chargement avec le bon paramètre', async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    renderPage()

    await waitFor(() => expect(listerAnomaliesMock).toHaveBeenCalledWith({ resolue: false }, 0, 20))

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'true' } })

    await waitFor(() => expect(listerAnomaliesMock).toHaveBeenCalledWith({ resolue: true }, 0, 20))
  })

  it('affiche un message quand la liste est vide', async () => {
    useAuthMock.mockReturnValue({ role: 'manager' })
    listerAnomaliesMock.mockResolvedValue({ content: [], totalElements: 0 })
    renderPage()

    await waitFor(() => expect(screen.getByText('Aucune anomalie')).toBeInTheDocument())
  })
})
