import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CorrigerPointageDialog } from './CorrigerPointageDialog'
import type { PointageReponse } from './api'

const pointage: PointageReponse = {
  id: 'pointage-1',
  employeId: 'emp-1',
  typeScan: 'entree',
  horodatage: '2026-01-15T08:45:00Z',
  corrigeManuellement: false,
  motifCorrection: null,
}

describe('CorrigerPointageDialog', () => {
  it("ne rend rien quand aucun pointage n'est ciblé", () => {
    render(
      <CorrigerPointageDialog
        pointage={null}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        submitting={false}
      />,
    )

    expect(screen.queryByText('Corriger le pointage')).not.toBeInTheDocument()
  })

  it('désactive la confirmation tant que le motif est vide', () => {
    render(
      <CorrigerPointageDialog
        pointage={pointage}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        submitting={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Confirmer la correction' })).toBeDisabled()
  })

  it('active la confirmation une fois un motif saisi et transmet horodatage + motif', () => {
    const onConfirm = vi.fn()
    render(
      <CorrigerPointageDialog
        pointage={pointage}
        onCancel={() => undefined}
        onConfirm={onConfirm}
        submitting={false}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Raison de la correction'), {
      target: { value: "Oubli de scan à l'arrivée" },
    })
    const confirmer = screen.getByRole('button', { name: 'Confirmer la correction' })
    expect(confirmer).not.toBeDisabled()
    fireEvent.click(confirmer)

    expect(onConfirm).toHaveBeenCalledOnce()
    const [horodatage, motif] = onConfirm.mock.calls[0]
    expect(motif).toBe("Oubli de scan à l'arrivée")
    expect(new Date(horodatage).toISOString()).toBe(horodatage)
  })

  it("signale un motif invalide seulement composé d'espaces", () => {
    render(
      <CorrigerPointageDialog
        pointage={pointage}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        submitting={false}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Raison de la correction'), {
      target: { value: '   ' },
    })

    expect(screen.getByText('Le motif est obligatoire')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer la correction' })).toBeDisabled()
  })

  it('appelle onCancel à la fermeture', () => {
    const onCancel = vi.fn()
    render(
      <CorrigerPointageDialog
        pointage={pointage}
        onCancel={onCancel}
        onConfirm={() => undefined}
        submitting={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
