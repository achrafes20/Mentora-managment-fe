import { apiClient } from '@/lib/apiClient'
import type { components } from '@/types/api'

export type OffreEmploi = components['schemas']['OffreEmploiReponse']
export type OffreEmploiRequete = components['schemas']['OffreEmploiRequete']
export type Candidature = components['schemas']['CandidatureReponse']
export type PageCandidatures = components['schemas']['PagedResponseCandidatureReponse']
export type ChangerStatutRequete = components['schemas']['ChangerStatutRequete']
export type Entretien = components['schemas']['EntretienReponse']
export type ResultatEntretienRequete = components['schemas']['ResultatEntretienRequete']
export type ReprogrammerEntretienRequete = components['schemas']['ReprogrammerEntretienRequete']

interface ApiResponse<T> {
  data?: T
}

export interface FiltresCandidatures {
  offreId?: string
  statut?: string
  scoreMin?: number
  recherche?: string
  page?: number
  size?: number
}

export async function listerOffres(statut?: string, categorie?: string): Promise<OffreEmploi[]> {
  const { data } = await apiClient.get<ApiResponse<OffreEmploi[]>>('/api/offres', {
    params: { statut: statut || undefined, categorie: categorie || undefined },
  })
  return data.data ?? []
}

export async function obtenirOffre(id: string): Promise<OffreEmploi> {
  const { data } = await apiClient.get<ApiResponse<OffreEmploi>>(`/api/offres/${id}`)
  return data.data as OffreEmploi
}

export async function creerOffre(requete: OffreEmploiRequete): Promise<OffreEmploi> {
  const { data } = await apiClient.post<ApiResponse<OffreEmploi>>('/api/offres', requete)
  return data.data as OffreEmploi
}

export async function modifierOffre(id: string, requete: OffreEmploiRequete): Promise<OffreEmploi> {
  const { data } = await apiClient.put<ApiResponse<OffreEmploi>>(`/api/offres/${id}`, requete)
  return data.data as OffreEmploi
}

export async function fermerOffre(id: string): Promise<OffreEmploi> {
  const { data } = await apiClient.post<ApiResponse<OffreEmploi>>(`/api/offres/${id}/fermer`)
  return data.data as OffreEmploi
}

export async function rouvrirOffre(id: string): Promise<OffreEmploi> {
  const { data } = await apiClient.post<ApiResponse<OffreEmploi>>(`/api/offres/${id}/rouvrir`)
  return data.data as OffreEmploi
}

export async function listerCandidatures(filtres: FiltresCandidatures): Promise<PageCandidatures> {
  const { data } = await apiClient.get<ApiResponse<PageCandidatures>>('/api/candidatures', {
    params: filtres,
  })
  return data.data as PageCandidatures
}

export async function obtenirCandidature(id: string): Promise<Candidature> {
  const { data } = await apiClient.get<ApiResponse<Candidature>>(`/api/candidatures/${id}`)
  return data.data as Candidature
}

export async function changerStatutCandidature(
  id: string,
  requete: ChangerStatutRequete,
): Promise<Candidature> {
  const { data } = await apiClient.post<ApiResponse<Candidature>>(
    `/api/candidatures/${id}/statut`,
    requete,
  )
  return data.data as Candidature
}

export async function relancerAnalyseCandidature(id: string): Promise<Candidature> {
  const { data } = await apiClient.post<ApiResponse<Candidature>>(
    `/api/candidatures/${id}/relancer-analyse`,
  )
  return data.data as Candidature
}

export async function validerReactivationCandidature(id: string): Promise<Candidature> {
  const { data } = await apiClient.post<ApiResponse<Candidature>>(
    `/api/candidatures/${id}/reactiver`,
  )
  return data.data as Candidature
}

// Comme EmployeApi.ouvrirDocument : un <a href> brut ne porte pas le jeton JWT, on télécharge en
// Blob via apiClient puis on ouvre ce Blob dans un nouvel onglet.
export async function voirCvCandidature(id: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/api/candidatures/${id}/cv`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function listerEntretiens(candidatureId: string): Promise<Entretien[]> {
  const { data } = await apiClient.get<ApiResponse<Entretien[]>>(
    `/api/candidatures/${candidatureId}/entretiens`,
  )
  return data.data ?? []
}

export async function reprogrammerEntretien(
  candidatureId: string,
  requete: ReprogrammerEntretienRequete,
): Promise<Entretien> {
  const { data } = await apiClient.post<ApiResponse<Entretien>>(
    `/api/candidatures/${candidatureId}/entretien/reprogrammer`,
    requete,
  )
  return data.data as Entretien
}

export async function enregistrerResultatEntretien(
  candidatureId: string,
  requete: ResultatEntretienRequete,
): Promise<Entretien> {
  const { data } = await apiClient.post<ApiResponse<Entretien>>(
    `/api/candidatures/${candidatureId}/entretien`,
    requete,
  )
  return data.data as Entretien
}
