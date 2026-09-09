import { apiClient } from '../../lib/apiClient'
import type { components } from '../../types/api'

export type ImportCible = 'DEPARTEMENTS' | 'EMPLOYES' | 'SOLDES_CONGES_INITIAUX'
export type StrategieDoublon = 'ECRASER' | 'IGNORER'
export type ImportApercu = components['schemas']['ImportApercuReponse']
export type ImportRapport = components['schemas']['ImportRapportReponse']
export type ImportLigne = components['schemas']['ImportLigneReponse']
export type ImportLot = components['schemas']['ImportLotReponse']
export type ImportChampSpec = components['schemas']['ImportChampSpecReponse']
export type PageImportLots = components['schemas']['PagedResponseImportLotReponse']

interface ApiResponse<T> {
  data?: T
}

export interface FiltresHistoriqueImport {
  page?: number
  size?: number
}

export async function previsualiserImport(
  fichier: File,
  cible: ImportCible,
): Promise<ImportApercu> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  const { data } = await apiClient.post<ApiResponse<ImportApercu>>(
    '/api/import/previsualiser',
    formData,
    {
      params: { cible },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data as ImportApercu
}

export async function analyserImport(
  fichier: File,
  cible: ImportCible,
  mapping: Record<string, number>,
  strategieDoublon: StrategieDoublon,
): Promise<ImportRapport> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  formData.append('mapping', new Blob([JSON.stringify(mapping)], { type: 'application/json' }))
  const { data } = await apiClient.post<ApiResponse<ImportRapport>>(
    '/api/import/analyser',
    formData,
    {
      params: { cible, strategieDoublon },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data as ImportRapport
}

export async function executerImport(
  fichier: File,
  cible: ImportCible,
  mapping: Record<string, number>,
  strategieDoublon: StrategieDoublon,
): Promise<ImportRapport> {
  const formData = new FormData()
  formData.append('fichier', fichier)
  formData.append('mapping', new Blob([JSON.stringify(mapping)], { type: 'application/json' }))
  const { data } = await apiClient.post<ApiResponse<ImportRapport>>(
    '/api/import/executer',
    formData,
    {
      params: { cible, strategieDoublon },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data.data as ImportRapport
}

export async function historiqueImports(filtres: FiltresHistoriqueImport): Promise<PageImportLots> {
  const { data } = await apiClient.get<ApiResponse<PageImportLots>>('/api/import/historique', {
    params: filtres,
  })
  return data.data as PageImportLots
}

export async function detailLotImport(lotId: string): Promise<ImportRapport> {
  const { data } = await apiClient.get<ApiResponse<ImportRapport>>(
    `/api/import/historique/${lotId}`,
  )
  return data.data as ImportRapport
}
