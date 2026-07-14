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

// Le lien direct vers l'API (sans passer par apiClient) ne porte pas le jeton JWT — l'intercepteur
// Authorization ne s'applique qu'aux requêtes axios de l'app, pas à une navigation <a href> brute.
// Depuis le RBAC réel (T1.C1), l'endpoint l'exige : on télécharge en Blob via apiClient, puis on
// ouvre ce Blob dans un nouvel onglet.
export async function ouvrirDocument(employeId: string, documentId: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(
    `/api/employes/${employeId}/documents/${documentId}/telecharger`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function televerserPhotoEmploye(id: string, photo: File): Promise<Employe> {
  const formData = new FormData()
  formData.append('photo', photo)
  const { data } = await apiClient.post<ApiResponse<Employe>>(
    `/api/employes/${id}/photo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data as Employe
}

export async function chargerPhotoEmploye(id: string): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/api/employes/${id}/photo`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

export async function supprimerDocumentEmploye(
  employeId: string,
  documentId: string,
): Promise<void> {
  await apiClient.delete(`/api/employes/${employeId}/documents/${documentId}`)
}

export async function remplacerDocumentEmploye(
  employeId: string,
  documentId: string,
  fichier: File,
): Promise<EmployeDocument> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  const { data } = await apiClient.put<ApiResponse<EmployeDocument>>(
    `/api/employes/${employeId}/documents/${documentId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data as EmployeDocument
}

export async function envoyerCarteParEmail(
  employeId: string,
  payload: { objet: string; corps: string; destinataire?: string },
): Promise<void> {
  await apiClient.post(`/api/employes/${employeId}/carte/envoyer-email`, payload)
}
