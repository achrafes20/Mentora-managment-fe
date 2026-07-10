import { apiClient } from '../../lib/apiClient'
import type { components } from '../../types/api'

export type Departement = components['schemas']['DepartementReponse']
export type DepartementRequete = components['schemas']['DepartementRequete']

interface ApiResponse<T> {
  data?: T
}

export async function listerDepartements(): Promise<Departement[]> {
  const { data } = await apiClient.get<ApiResponse<Departement[]>>('/api/departements')
  return data.data ?? []
}

export async function creerDepartement(requete: DepartementRequete): Promise<Departement> {
  const { data } = await apiClient.post<ApiResponse<Departement>>('/api/departements', requete)
  return data.data as Departement
}

export async function modifierDepartement(
  id: string,
  requete: DepartementRequete,
): Promise<Departement> {
  const { data } = await apiClient.put<ApiResponse<Departement>>(`/api/departements/${id}`, requete)
  return data.data as Departement
}

export async function desactiverDepartement(id: string): Promise<void> {
  await apiClient.delete(`/api/departements/${id}`)
}

export async function activerDepartement(id: string): Promise<Departement> {
  const { data } = await apiClient.post<ApiResponse<Departement>>(`/api/departements/${id}/activer`)
  return data.data as Departement
}
