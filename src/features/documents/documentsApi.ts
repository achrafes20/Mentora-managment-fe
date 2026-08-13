import { apiClient } from '../../lib/apiClient'
import type { components } from '../../types/api'

export interface EnvoiDocumentResponse {
  id: string
  employeId: string
  typeDocument:
    | 'certificat_stage'
    | 'certificat_travail'
    | 'attestation_travail'
    | 'attestation_salaire'
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

export async function apercuAttestationSalaire(employeId: string): Promise<void> {
  await ouvrirApercu(`/api/documents/employes/${employeId}/attestation-salaire/apercu`)
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

export async function envoyerAttestationSalaire(employeId: string): Promise<EnvoiDocumentResponse> {
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/attestation-salaire`,
  )
  return data.data!
}

export async function envoyerDocumentLibre(
  employeId: string,
  fichier: File,
  corpsMessage?: string,
): Promise<EnvoiDocumentResponse> {
  const formData = new FormData()
  formData.append('file', fichier)
  if (corpsMessage) formData.append('corpsMessage', corpsMessage)
  const { data } = await apiClient.post<ApiResponse<EnvoiDocumentResponse>>(
    `/api/documents/employes/${employeId}/document-libre`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data!
}

export type NotificationPlanifieeResponse = components['schemas']['NotificationPlanifieeReponse']
export type PageSurveillance = components['schemas']['PagedResponseNotificationPlanifieeReponse']

const PAGE_VIDE: PageSurveillance = {
  content: [],
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  last: true,
}

// Fenêtre resserrée à 10 jours par défaut (au lieu des 30 jours renvoyés par le backend avant
// EF-DOC : un pic de stagiaires l'été peut produire des dizaines d'échéances simultanées) —
// `jours` reste ajustable côté écran pour élargir la vue. Résultat paginé, trié par échéance
// croissante par le backend (le plus urgent en premier).
export async function listerSurveillance(
  page = 0,
  size = 10,
  jours = 10,
): Promise<PageSurveillance> {
  const { data } = await apiClient.get<ApiResponse<PageSurveillance>>(
    '/api/documents/surveillance',
    { params: { page, size, jours } },
  )
  return data.data ?? PAGE_VIDE
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
