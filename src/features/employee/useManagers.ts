import { useQuery } from '@tanstack/react-query'
import { listManagers, type UserResponse } from '../../lib/authApi'

export type Manager = UserResponse

const CLE_MANAGERS = ['managers'] as const

/**
 * Comptes Manager actifs, pour peupler les sélecteurs de manager. GET /api/users/managers (pas
 * /api/users) : accessible à un délégué actif, pas seulement Admin — nécessaire pour que
 * EntretienScheduleDialog fonctionne pour un Manager délégué (bug E2E du 2026-07-23 : dropdown
 * vide car /api/users est réservé Admin).
 */
export function useManagers() {
  return useQuery({
    queryKey: CLE_MANAGERS,
    queryFn: listManagers,
  })
}

export function libelleManager(manager: Manager): string {
  return `${manager.prenom} ${manager.nom}`
}
