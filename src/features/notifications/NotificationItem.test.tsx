import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationItem } from './NotificationItem'
import type { NotificationInApp } from './notificationsApi'

const notification: NotificationInApp = {
  id: '5ec8eb64-d208-4f10-b29b-7533fc91019c',
  titre: 'Nouvel entretien a preparer',
  message: 'La candidature de Sara Amrani vous a ete attribuee.',
  module: 'recrutement',
  lienAction: '/recrutement/candidat-1',
  entiteType: 'candidature',
  entiteId: 'candidat-1',
  lu: false,
  luLe: null,
  mattermostTente: true,
  mattermostReussi: false,
  creeLe: new Date().toISOString(),
}

describe('NotificationItem', () => {
  it('affiche le contenu et signale une notification non lue', () => {
    render(<NotificationItem notification={notification} onOpen={() => undefined} />)

    expect(screen.getByText(notification.titre)).toBeInTheDocument()
    expect(screen.getByText(notification.message)).toBeInTheDocument()
    expect(screen.getByLabelText('Non lue')).toBeInTheDocument()
  })

  it('declenche la lecture au clic', () => {
    const onOpen = vi.fn()
    render(<NotificationItem notification={{ ...notification, lu: true }} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onOpen).toHaveBeenCalledOnce()
    expect(screen.queryByLabelText('Non lue')).not.toBeInTheDocument()
  })
})
