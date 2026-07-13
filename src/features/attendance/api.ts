import { apiClient } from '../../lib/apiClient'

// ---- Types ----

interface ApiResponse<T> {
  data?: T
}

interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface QrCodeReponse {
  id: string
  employeId: string
  valeur: string
  actif: boolean
  bloque: boolean
  genereLe: string
}

export interface PointageReponse {
  id: string
  employeId: string
  typeScan: 'entree' | 'sortie'
  horodatage: string
  corrigeManuellement: boolean
  motifCorrection: string | null
}

export interface AnomaliePointageReponse {
  id: string
  employeId: string
  datePointage: string
  typeAnomalie: 'retard' | 'depart_anticipe' | 'absence_checkout' | 'presence_incomplete'
  resolue: boolean
  creeLe: string
}

export interface HoraireReferenceReponse {
  id: string
  heureDebutMatin: string
  heureFinMatin: string
  heureDebutApresMidi: string
  heureFinApresMidi: string
  toleranceMinutes: number
  dateEffet: string
}

export interface PlanningTeletravailReponse {
  id: string
  employeId: string
  dateDebut: string
  dateFin: string | null
  jours: string[]
  creeLe: string
}

// ---- Kiosque (public) ----

export async function scannerKiosque(
  valeurQr: string,
  typeScan: 'entree' | 'sortie',
): Promise<PointageReponse> {
  const { data } = await apiClient.post<ApiResponse<PointageReponse>>('/api/kiosque/scan', {
    valeurQr,
    typeScan,
  })
  return data.data as PointageReponse
}

// ---- QR Code ----

export async function genererQrCode(employeId: string): Promise<QrCodeReponse> {
  const { data } = await apiClient.post<ApiResponse<QrCodeReponse>>(
    `/api/pointages/qr-code/generer/${employeId}`,
  )
  return data.data as QrCodeReponse
}

export async function qrCodeActif(employeId: string): Promise<QrCodeReponse | null> {
  const { data } = await apiClient.get<ApiResponse<QrCodeReponse | null>>(
    `/api/pointages/qr-code/${employeId}`,
  )
  return data.data ?? null
}

// ---- Pointages ----

export async function listerPointages(
  page = 0,
  size = 20,
): Promise<PagedResponse<PointageReponse>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<PointageReponse>>>(
    '/api/pointages',
    { params: { page, size } },
  )
  return data.data as PagedResponse<PointageReponse>
}

export async function listerPointagesEmploye(
  employeId: string,
  page = 0,
  size = 20,
): Promise<PagedResponse<PointageReponse>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<PointageReponse>>>(
    `/api/pointages/employe/${employeId}`,
    { params: { page, size } },
  )
  return data.data as PagedResponse<PointageReponse>
}

export async function corrigerPointage(
  id: string,
  nouvelHorodatage: string,
  motif: string,
): Promise<PointageReponse> {
  const { data } = await apiClient.post<ApiResponse<PointageReponse>>(
    `/api/pointages/${id}/corriger`,
    { nouvelHorodatage, motif },
  )
  return data.data as PointageReponse
}

// ---- Anomalies ----

export async function listerAnomalies(
  resolue?: boolean,
  page = 0,
  size = 20,
): Promise<PagedResponse<AnomaliePointageReponse>> {
  const params: Record<string, unknown> = { page, size }
  if (resolue !== undefined) params.resolue = resolue
  const { data } = await apiClient.get<ApiResponse<PagedResponse<AnomaliePointageReponse>>>(
    '/api/anomalies',
    { params },
  )
  return data.data as PagedResponse<AnomaliePointageReponse>
}

export async function resoudreAnomalie(id: string): Promise<AnomaliePointageReponse> {
  const { data } = await apiClient.post<ApiResponse<AnomaliePointageReponse>>(
    `/api/anomalies/${id}/resoudre`,
  )
  return data.data as AnomaliePointageReponse
}

// ---- Horaires de référence ----

export async function listerHorairesReference(): Promise<HoraireReferenceReponse[]> {
  const { data } =
    await apiClient.get<ApiResponse<HoraireReferenceReponse[]>>('/api/horaires-reference')
  return data.data ?? []
}

export async function creerHoraireReference(requete: {
  heureDebutMatin: string
  heureFinMatin: string
  heureDebutApresMidi: string
  heureFinApresMidi: string
  toleranceMinutes: number
  dateEffet: string
}): Promise<HoraireReferenceReponse> {
  const { data } = await apiClient.post<ApiResponse<HoraireReferenceReponse>>(
    '/api/horaires-reference',
    requete,
  )
  return data.data as HoraireReferenceReponse
}

// ---- Télétravail ----

export async function listerPlanningsTeletravail(
  employeId: string,
): Promise<PlanningTeletravailReponse[]> {
  const { data } = await apiClient.get<ApiResponse<PlanningTeletravailReponse[]>>(
    `/api/employes/${employeId}/teletravail`,
  )
  return data.data ?? []
}

export async function creerPlanningTeletravail(
  employeId: string,
  requete: { dateDebut: string; dateFin?: string; jours: string[] },
): Promise<PlanningTeletravailReponse> {
  const { data } = await apiClient.post<ApiResponse<PlanningTeletravailReponse>>(
    `/api/employes/${employeId}/teletravail`,
    requete,
  )
  return data.data as PlanningTeletravailReponse
}

export async function supprimerPlanningTeletravail(
  employeId: string,
  planningId: string,
): Promise<void> {
  await apiClient.delete(`/api/employes/${employeId}/teletravail/${planningId}`)
}
