import { apiClient } from '../../lib/apiClient'

export interface EnvoiDocumentResponse {
  id: string
  employeId: string
  typeDocument:
    | 'certificat_stage'
    | 'certificat_travail'
    | 'attestation_travail'
    | 'document_libre'
    | 'email_rejet_candidature'
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

// EF-DOC : aperçu du PDF avant confirmation d'envoi — même génération que l'envoi réel côté
// backend, mais sans e-mail ni enregistrement dans l'historique. Ouvert dans un nouvel onglet
// plutôt qu'un lien <a href> brut : l'intercepteur Authorization ne porte pas sur une navigation
// directe (même principe que `ouvrirDocument` dans employesApi.ts).
async function ouvrirApercu(url: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(data)
  window.open(blobUrl, '_blank', 'noreferrer')
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}

export async function apercuCertificatStage(employeId: string, sujetStage?: string): Promise<void> {
  const params = sujetStage ? `?sujetStage=${encodeURIComponent(sujetStage)}` : ''
  await ouvrirApercu(`/api/documents/employes/${employeId}/certificat-stage/apercu${params}`)
}

export async function apercuCertificatTravail(employeId: string): Promise<void> {
  await ouvrirApercu(`/api/documents/employes/${employeId}/certificat-travail/apercu`)
}

export async function apercuAttestationTravail(employeId: string): Promise<void> {
  await ouvrirApercu(`/api/documents/employes/${employeId}/attestation-travail/apercu`)
}

export async function envoyerCertificatStage(
  employeId: string,
  sujetStage?: string,
): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/certificat-stage`,
    sujetStage ? { sujetStage } : undefined,
  )
  return data.data!
}

export async function envoyerCertificatTravail(employeId: string): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/certificat-travail`,
  )
  return data.data!
}

export async function envoyerAttestationTravail(employeId: string): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/attestation-travail`,
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

// Déclenchement manuel du balayage par un Admin authentifié (Bearer, RBAC normal) — distinct de
// /api/internal/surveillance/run, réservé au cron n8n via un secret partagé qui ne doit jamais
// être embarqué côté frontend (cf. InternalWebhookGuard).
export async function executerSurveillance(): Promise<void> {
  await apiClient.post('/api/documents/surveillance/executer')
}
