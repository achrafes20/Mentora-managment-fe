import { apiClient } from '../../lib/apiClient'
import type { components } from '../../types/api'

export type Employe = components['schemas']['EmployeReponse']
export type EmployeRequete = components['schemas']['EmployeRequete']
export type EmployeModificationRequete = components['schemas']['EmployeModificationRequete']
export type TransfertRequete = components['schemas']['TransfertRequete']
export type DesactivationRequete = components['schemas']['DesactivationRequete']
export type EmployeDocument = components['schemas']['EmployeDocumentReponse']
export type EmployeTransfert = components['schemas']['EmployeTransfertReponse']
export type PageEmployes = components['schemas']['PagedResponseEmployeReponse']

interface ApiResponse<T> {
  data?: T
}

export interface FiltresEmployes {
  departementId?: string
  managerId?: string
  typeContrat?: string
  statut?: string
  recherche?: string
  page?: number
  size?: number
}

export async function listerEmployes(filtres: FiltresEmployes): Promise<PageEmployes> {
  const { data } = await apiClient.get<ApiResponse<PageEmployes>>('/api/employes', {
    params: filtres,
  })
  return data.data as PageEmployes
}

export async function obtenirEmploye(id: string): Promise<Employe> {
  const { data } = await apiClient.get<ApiResponse<Employe>>(`/api/employes/${id}`)
  return data.data as Employe
}

export async function creerEmploye(requete: EmployeRequete): Promise<Employe> {
  const { data } = await apiClient.post<ApiResponse<Employe>>('/api/employes', requete)
  return data.data as Employe
}

export async function modifierEmploye(
  id: string,
  requete: EmployeModificationRequete,
): Promise<Employe> {
  const { data } = await apiClient.put<ApiResponse<Employe>>(`/api/employes/${id}`, requete)
  return data.data as Employe
}

export async function transfererEmploye(id: string, requete: TransfertRequete): Promise<Employe> {
  const { data } = await apiClient.post<ApiResponse<Employe>>(
    `/api/employes/${id}/transferer`,
    requete,
  )
  return data.data as Employe
}

export async function desactiverEmploye(id: string, requete: DesactivationRequete): Promise<void> {
  await apiClient.post(`/api/employes/${id}/desactiver`, requete)
}

export async function listerDocumentsEmploye(id: string): Promise<EmployeDocument[]> {
  const { data } = await apiClient.get<ApiResponse<EmployeDocument[]>>(
    `/api/employes/${id}/documents`,
  )
  return data.data ?? []
}

export async function attacherDocumentEmploye(
  id: string,
  fichier: File,
  typeDocument: string,
): Promise<EmployeDocument> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  formData.append('typeDocument', typeDocument)
  const { data } = await apiClient.post<ApiResponse<EmployeDocument>>(
    `/api/employes/${id}/documents`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data as EmployeDocument
}

export async function historiqueTransfertsEmploye(id: string): Promise<EmployeTransfert[]> {
  const { data } = await apiClient.get<ApiResponse<EmployeTransfert[]>>(
    `/api/employes/${id}/transferts`,
  )
  return data.data ?? []
}

export function urlTelechargementDocument(employeId: string, documentId: string): string {
  return `${apiClient.defaults.baseURL}/api/employes/${employeId}/documents/${documentId}/telecharger`
}
