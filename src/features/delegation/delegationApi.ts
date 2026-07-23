import { apiClient } from '@/lib/apiClient'
import type { components } from '@/types/api'

export type Delegation = components['schemas']['DelegationReponse']
export type DelegationCreationRequete = components['schemas']['DelegationCreationRequete']

interface ApiResponse<T> {
  data?: T
}

export async function listerDelegations(): Promise<Delegation[]> {
  const { data } = await apiClient.get<ApiResponse<Delegation[]>>('/api/delegations')
  return data.data ?? []
}

/**
 * Réservé Admin-only côté backend (voir listerDelegations) : GET /api/delegations/moi n'expose
 * que la délégation active de l'utilisateur courant en tant que délégué, jamais l'historique
 * complet — c'est le seul appel qu'un Manager est autorisé à faire pour savoir s'il doit voir les
 * actions d'approbation/décision (cf. useEstDelegueActifMaintenant).
 */
export async function obtenirMaDelegationActive(): Promise<Delegation | null> {
  const { data } = await apiClient.get<ApiResponse<Delegation>>('/api/delegations/moi')
  return data.data ?? null
}

export async function creerDelegation(requete: DelegationCreationRequete): Promise<Delegation> {
  const { data } = await apiClient.post<ApiResponse<Delegation>>('/api/delegations', requete)
  return data.data as Delegation
}

export async function revoquerDelegation(id: string): Promise<Delegation> {
  const { data } = await apiClient.post<ApiResponse<Delegation>>(`/api/delegations/${id}/revoquer`)
  return data.data as Delegation
}
