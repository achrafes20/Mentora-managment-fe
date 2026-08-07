import { apiClient } from '../../lib/apiClient'
import { declencherTelechargement } from '../../lib/downloadBlob'

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
  typeAnomalie: 'retard' | 'depart_anticipe' | 'absence_checkout' | 'absence_totale'
  resolue: boolean
  creeLe: string
}

export interface PolitiqueAnomaliesReponse {
  id: string | null
  seuilAnomalies: number
  periodeJours: number
  modifiePar?: string
  modifieLe?: string
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

const EN_TETE_JETON_APPAREIL = 'X-Kiosque-Device-Token'

// EF-ATT-17 : deux preuves — l'identité vient de l'appairage de l'appareil (jetonAppareil), la
// présence physique au lieu vient du QR de site scanné (valeurQrSite).
export async function scannerPersonnel(
  typeScan: 'entree' | 'sortie',
  valeurQrSite: string,
  jetonAppareil: string,
): Promise<PointageReponse> {
  const { data } = await apiClient.post<ApiResponse<PointageReponse>>(
    '/api/kiosque/scan-personnel',
    { typeScan, valeurQrSite },
    { headers: { [EN_TETE_JETON_APPAREIL]: jetonAppareil } },
  )
  return data.data as PointageReponse
}

// EF-ATT-19 : révocation en self-service depuis le lien reçu par e-mail — aucun jeton d'appareil
// ni session requis, le jeton de révocation lui-même est la preuve d'intention.
export async function revoquerParJeton(jeton: string): Promise<void> {
  await apiClient.post('/api/kiosque/revoquer-perte', { jeton })
}

// EF-ATT-17 : historique perso affiché sur /pointage-mobile.
export async function mesPointagesRecents(jetonAppareil: string): Promise<PointageReponse[]> {
  const { data } = await apiClient.get<ApiResponse<PointageReponse[]>>(
    '/api/kiosque/mes-pointages',
    { headers: { [EN_TETE_JETON_APPAREIL]: jetonAppareil } },
  )
  return data.data ?? []
}

// ---- QR de site (Admin, ou délégué actif) ----

export interface SiteQrCodeReponse {
  id: string
  libelle: string
  valeur: string
  actif: boolean
  creePar: string | null
  creeLe: string
}

export async function genererSiteQr(libelle: string): Promise<SiteQrCodeReponse> {
  const { data } = await apiClient.post<ApiResponse<SiteQrCodeReponse>>('/api/kiosque/sites', {
    libelle,
  })
  return data.data as SiteQrCodeReponse
}

export async function listerSitesQr(): Promise<SiteQrCodeReponse[]> {
  const { data } = await apiClient.get<ApiResponse<SiteQrCodeReponse[]>>('/api/kiosque/sites')
  return data.data ?? []
}

export async function desactiverSiteQr(id: string): Promise<void> {
  await apiClient.post(`/api/kiosque/sites/${id}/desactiver`)
}

export async function statutActivationAppareil(jetonAppareil: string | null): Promise<boolean> {
  if (!jetonAppareil) return false
  const { data } = await apiClient.get<ApiResponse<{ actif: boolean }>>(
    '/api/kiosque/activation/statut',
    { headers: { [EN_TETE_JETON_APPAREIL]: jetonAppareil } },
  )
  return data.data?.actif ?? false
}

/** Échange un code d'activation contre un jeton d'appareil (à stocker côté client). */
export async function verifierCodeActivation(code: string): Promise<string> {
  const { data } = await apiClient.post<ApiResponse<{ jetonAppareil: string }>>(
    '/api/kiosque/activation/verifier',
    { code },
  )
  return (data.data as { jetonAppareil: string }).jetonAppareil
}

// ---- Kiosque — gestion des activations (Admin, ou délégué actif) ----

export interface KiosqueActivationReponse {
  id: string
  emisPar: string
  delegationId: string | null
  employeId: string | null
  emisLe: string
  statut: 'en_attente' | 'active' | 'revoquee'
  activeeLe: string | null
  revoqueeLe: string | null
  revoqueePar: string | null
}

// EF-ATT-16 : code lié à un employé — une fois saisi sur son téléphone, l'appareil devient sa
// propre identité de pointage (voir scannerPersonnel ci-dessous).
export async function genererCodeActivationPersonnel(
  employeId: string,
): Promise<{ id: string; code: string }> {
  const { data } = await apiClient.post<ApiResponse<{ id: string; code: string }>>(
    `/api/kiosque/activations/personnel/${employeId}`,
  )
  return data.data as { id: string; code: string }
}

export async function listerActivationsKiosque(): Promise<KiosqueActivationReponse[]> {
  const { data } = await apiClient.get<ApiResponse<KiosqueActivationReponse[]>>(
    '/api/kiosque/activations',
  )
  return data.data ?? []
}

export async function revoquerActivationKiosque(id: string): Promise<void> {
  await apiClient.post(`/api/kiosque/activations/${id}/revoquer`)
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

export interface FiltresPointages {
  employeId?: string
  typeScan?: 'entree' | 'sortie'
  debut?: string
  fin?: string
}

export async function listerPointages(
  filtres: FiltresPointages = {},
  page = 0,
  size = 20,
  sort?: string,
): Promise<PagedResponse<PointageReponse>> {
  const params: Record<string, unknown> = { page, size }
  if (filtres.employeId) params.employeId = filtres.employeId
  if (filtres.typeScan) params.typeScan = filtres.typeScan
  if (filtres.debut) params.debut = filtres.debut
  if (filtres.fin) params.fin = filtres.fin
  if (sort) params.sort = sort
  const { data } = await apiClient.get<ApiResponse<PagedResponse<PointageReponse>>>(
    '/api/pointages',
    { params },
  )
  return data.data as PagedResponse<PointageReponse>
}

// ---- Tableau de bord ----

export interface AnomalieEmployeReponse {
  employeId: string
  nomComplet: string
  nombreAnomalies: number
}

export interface RepartitionTypeAnomalieReponse {
  type: 'retard' | 'depart_anticipe' | 'absence_checkout' | 'absence_totale'
  nombre: number
}

export interface PresenceDashboardReponse {
  tauxPresence30Jours: number
  joursOuvresPeriode: number
  topAnomaliesRecurrentes: AnomalieEmployeReponse[]
  repartitionParType: RepartitionTypeAnomalieReponse[]
}

export async function obtenirTableauDeBordPresence(): Promise<PresenceDashboardReponse> {
  const { data } = await apiClient.get<ApiResponse<PresenceDashboardReponse>>(
    '/api/pointages/dashboard',
  )
  return data.data as PresenceDashboardReponse
}

// EF-ATT-15 : statut calculé en direct, jamais persisté — voir PointageService#aujourdhui.
export interface PresenceAujourdhuiReponse {
  employeId: string
  nomComplet: string
  statut: 'present' | 'parti' | 'teletravail' | 'conge' | 'absent'
  heureEntree?: string
  heureSortie?: string
}

export async function obtenirPresenceAujourdhui(): Promise<PresenceAujourdhuiReponse[]> {
  const { data } = await apiClient.get<ApiResponse<PresenceAujourdhuiReponse[]>>(
    '/api/pointages/aujourdhui',
  )
  return data.data ?? []
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

// EF-EXP-02 / EF-ATT-10 : feuille de présence sur une période, un employé (si fourni) ou
// l'équipe/l'ensemble des employés actifs sinon — même périmètre Manager que le reste du module.
export async function exporterPresence(
  filtres: { employeId?: string; debut: string; fin: string },
  format: 'xlsx' | 'pdf',
): Promise<void> {
  const { data } = await apiClient.get<Blob>('/api/pointages/export', {
    params: { ...filtres, format },
    responseType: 'blob',
  })
  declencherTelechargement(data, `presence_${filtres.debut}_${filtres.fin}.${format}`)
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

export interface FiltresAnomalies {
  employeId?: string
  type?: RepartitionTypeAnomalieReponse['type']
  resolue?: boolean
  debut?: string
  fin?: string
}

export async function listerAnomalies(
  filtres: FiltresAnomalies = {},
  page = 0,
  size = 20,
  sort?: string,
): Promise<PagedResponse<AnomaliePointageReponse>> {
  const params: Record<string, unknown> = { page, size }
  if (filtres.employeId) params.employeId = filtres.employeId
  if (filtres.type) params.type = filtres.type
  if (filtres.resolue !== undefined) params.resolue = filtres.resolue
  if (filtres.debut) params.debut = filtres.debut
  if (filtres.fin) params.fin = filtres.fin
  if (sort) params.sort = sort
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

export async function obtenirPolitiqueAnomalies(): Promise<PolitiqueAnomaliesReponse> {
  const { data } = await apiClient.get<ApiResponse<PolitiqueAnomaliesReponse>>(
    '/api/politique-anomalies',
  )
  return data.data as PolitiqueAnomaliesReponse
}

export async function modifierPolitiqueAnomalies(requete: {
  seuilAnomalies: number
  periodeJours: number
}): Promise<PolitiqueAnomaliesReponse> {
  const { data } = await apiClient.put<ApiResponse<PolitiqueAnomaliesReponse>>(
    '/api/politique-anomalies',
    requete,
  )
  return data.data as PolitiqueAnomaliesReponse
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
