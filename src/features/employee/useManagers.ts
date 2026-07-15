import { useQuery } from '@tanstack/react-query'
import { listUsers, type UserResponse } from '../../lib/authApi'

export type Manager = UserResponse

const CLE_MANAGERS = ['managers'] as const

/** Comptes Manager actifs, pour peupler les sélecteurs de manager (Admin uniquement). */
export function useManagers() {
  return useQuery({
    queryKey: CLE_MANAGERS,
    queryFn: async () => {
      const utilisateurs = await listUsers()
      return utilisateurs.filter((u) => u.role === 'manager' && u.statut === 'actif')
    },
  })
}

export function libelleManager(manager: Manager): string {
  return `${manager.prenom} ${manager.nom}`
}
