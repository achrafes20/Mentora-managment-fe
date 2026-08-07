import { apiClient } from '@/lib/apiClient'
import { declencherTelechargement } from '@/lib/downloadBlob'

interface ApiResponse<T> {
  data?: T
}

export type TypeDemandeAdministrative =
  | 'conge'
  | 'bon_sortie'
  | 'document_libre'
  | 'autre'
  | 'conge_mariage'
  | 'conge_naissance'
  | 'conge_deces'
  | 'conge_maladie'
export type GranulariteConge = 'journee' | 'demi_matin' | 'demi_apres_midi'
export type StatutDemandeAdministrative = 'en_attente' | 'approuvee' | 'rejetee' | 'annulee'
export type TypeMouvementConge = 'initialisation' | 'consommation' | 'recredit' | 'ajustement'

export interface DemandeAdministrative {
  id: string
  employeId: string
  employeNomComplet: string
  typeDemande: TypeDemandeAdministrative
  statut: StatutDemandeAdministrative
  granularite?: GranulariteConge
  dateDebut?: string
  dateFin?: string
  heureDepart?: string
  heureRetourPrevue?: string
  motif?: string
  dureeJours?: number
  creeLe?: string
  dateDecision?: string
  fichierDocumentLibreId?: string
}

export interface DemandeAdministrativeRequete {
  employeId: string
  typeDemande: TypeDemandeAdministrative
  granularite?: GranulariteConge
  dateDebut?: string
  dateFin?: string
  heureDepart?: string
  heureRetourPrevue?: string
  motif?: string
  fichierDocumentLibreId?: string
}

export interface SoldeConge {
  employeId: string
  employeNomComplet: string
  acquisJours: number
  mouvementsJours: number
  soldeJours: number
}

export interface MouvementConge {
  id: string
  demandeId?: string
  typeMouvement: TypeMouvementConge
  quantiteJours: number
  commentaire?: string
  creeLe?: string
}

export interface JourFerie {
  id: string
  dateFerie: string
  libelle: string
}

export interface PeriodeBlocageConges {
  id: string
  dateDebut: string
  dateFin: string
  libelle: string
}

export interface PolitiqueConge {
  typeContrat: string
  joursParMois: number
  modifiePar?: string
  modifieLe?: string
}

export interface PageDemandesAdministratives {
  content?: DemandeAdministrative[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

export interface FiltresDemandes {
  type?: TypeDemandeAdministrative | ''
  statut?: StatutDemandeAdministrative | ''
  employeId?: string
  debut?: string
  fin?: string
  page?: number
  size?: number
  sort?: string
}

export async function listerDemandes(
  filtres: FiltresDemandes,
): Promise<PageDemandesAdministratives> {
  const { data } = await apiClient.get<ApiResponse<PageDemandesAdministratives>>(
    '/api/demandes-administratives',
    { params: filtres },
  )
  return data.data ?? { content: [] }
}

// EF-EXP-03 : mêmes filtres que listerDemandes (hors pagination).
export async function exporterDemandes(
  filtres: Omit<FiltresDemandes, 'page' | 'size'>,
  format: 'xlsx' | 'pdf',
): Promise<void> {
  const { data } = await apiClient.get<Blob>('/api/demandes-administratives/export', {
    params: { ...filtres, format },
    responseType: 'blob',
  })
  declencherTelechargement(data, `demandes_administratives.${format}`)
}

export async function creerDemande(
  requete: DemandeAdministrativeRequete,
): Promise<DemandeAdministrative> {
  const { data } = await apiClient.post<ApiResponse<DemandeAdministrative>>(
    '/api/demandes-administratives',
    requete,
  )
  return data.data as DemandeAdministrative
}

// EF-ADM-14 : justificatif (arrêt de travail...) téléversé avant la création de la demande —
// l'UUID retourné est ensuite passé en fichierDocumentLibreId dans creerDemande().
export async function televerserJustificatif(fichier: File): Promise<string> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  const { data } = await apiClient.post<ApiResponse<string>>(
    '/api/demandes-administratives/justificatif',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data as string
}

export async function approuverDemande(id: string): Promise<DemandeAdministrative> {
  const { data } = await apiClient.patch<ApiResponse<DemandeAdministrative>>(
    `/api/demandes-administratives/${id}/approuver`,
  )
  return data.data as DemandeAdministrative
}

export async function rejeterDemande(id: string): Promise<DemandeAdministrative> {
  const { data } = await apiClient.patch<ApiResponse<DemandeAdministrative>>(
    `/api/demandes-administratives/${id}/rejeter`,
  )
  return data.data as DemandeAdministrative
}

export async function annulerDemande(id: string): Promise<DemandeAdministrative> {
  const { data } = await apiClient.patch<ApiResponse<DemandeAdministrative>>(
    `/api/demandes-administratives/${id}/annuler`,
  )
  return data.data as DemandeAdministrative
}

export async function obtenirSolde(employeId: string): Promise<SoldeConge> {
  const { data } = await apiClient.get<ApiResponse<SoldeConge>>(
    `/api/demandes-administratives/employes/${employeId}/solde`,
  )
  return data.data as SoldeConge
}

export async function listerMouvements(employeId: string): Promise<MouvementConge[]> {
  const { data } = await apiClient.get<ApiResponse<MouvementConge[]>>(
    `/api/demandes-administratives/employes/${employeId}/mouvements`,
  )
  return data.data ?? []
}

export async function listerJoursFeries(): Promise<JourFerie[]> {
  const { data } = await apiClient.get<ApiResponse<JourFerie[]>>(
    '/api/demandes-administratives/jours-feries',
  )
  return data.data ?? []
}

export async function creerJourFerie(requete: {
  dateFerie: string
  libelle: string
}): Promise<JourFerie> {
  const { data } = await apiClient.post<ApiResponse<JourFerie>>(
    '/api/demandes-administratives/jours-feries',
    requete,
  )
  return data.data as JourFerie
}

export async function supprimerJourFerie(id: string): Promise<void> {
  await apiClient.delete(`/api/demandes-administratives/jours-feries/${id}`)
}

export async function listerPeriodesBlocageConges(): Promise<PeriodeBlocageConges[]> {
  const { data } = await apiClient.get<ApiResponse<PeriodeBlocageConges[]>>(
    '/api/demandes-administratives/periodes-blocage-conges',
  )
  return data.data ?? []
}

export async function creerPeriodeBlocageConges(requete: {
  dateDebut: string
  dateFin: string
  libelle: string
}): Promise<PeriodeBlocageConges> {
  const { data } = await apiClient.post<ApiResponse<PeriodeBlocageConges>>(
    '/api/demandes-administratives/periodes-blocage-conges',
    requete,
  )
  return data.data as PeriodeBlocageConges
}

export async function supprimerPeriodeBlocageConges(id: string): Promise<void> {
  await apiClient.delete(`/api/demandes-administratives/periodes-blocage-conges/${id}`)
}

export async function listerPolitiqueConges(): Promise<PolitiqueConge[]> {
  const { data } = await apiClient.get<ApiResponse<PolitiqueConge[]>>(
    '/api/demandes-administratives/politique-conges',
  )
  return data.data ?? []
}

export async function modifierPolitiqueConge(
  typeContrat: string,
  joursParMois: number,
): Promise<PolitiqueConge> {
  const { data } = await apiClient.put<ApiResponse<PolitiqueConge>>(
    `/api/demandes-administratives/politique-conges/${typeContrat}`,
    { joursParMois },
  )
  return data.data as PolitiqueConge
}
