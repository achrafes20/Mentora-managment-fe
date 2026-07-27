import { apiClient } from '../../lib/apiClient'

export interface EnvoiDocumentResponse {
  id: string
  employeId: string
  typeDocument:
    'certificat_stage' | 'certificat_travail' | 'document_libre' | 'email_rejet_candidature'
  fichierId: string
  destinataireEmail: string
  dateEnvoi: string
  envoyePar: string
}

interface ApiResponse<T> {
  data?: T
}

export async function listerEnvoisDocuments(employeId: string): Promise<EnvoiDocumentResponse[]> {
  const { data } = await apiClient.get<ApiResponse<EnvoiDocumentResponse[]>>(
    `/api/documents/employes/${employeId}`,
  )
  return data.data ?? []
}

export async function envoyerCertificatStage(employeId: string): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/certificat-stage`,
  )
  return data.data!
}

export async function envoyerCertificatTravail(employeId: string): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/certificat-travail`,
  )
  return data.data!
}

export async function envoyerDocumentLibre(
  employeId: string,
  fichier: File,
): Promise<EnvoiDocumentResponse> {
  const formData = new FormData()
  formData.append('file', fichier)
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/document-libre`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data!
}

export interface NotificationPlanifieeResponse {
  id: string
  employeId: string
  typeFinSurveillee: string
  dateEcheance: string
  statut: string
}

export async function listerSurveillance(): Promise<NotificationPlanifieeResponse[]> {
  const { data } = await apiClient.get<ApiResponse<NotificationPlanifieeResponse[]>>(
    '/api/documents/surveillance',
  )
  return data.data ?? []
}

export async function renvoyerDocumentSurveillance(
  notifId: string,
): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/surveillance/${notifId}/renvoyer`,
  )
  return data.data!
}
