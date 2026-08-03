import { apiClient } from '@/lib/apiClient'
import type { components } from '@/types/api'

export type IdentiteEntreprise = components['schemas']['IdentiteEntrepriseReponse']
export type IdentiteEntrepriseRequete = components['schemas']['IdentiteEntrepriseRequete']

interface ApiResponse<T> {
  data?: T
}

export async function obtenirIdentiteEntreprise(): Promise<IdentiteEntreprise> {
  const { data } = await apiClient.get<ApiResponse<IdentiteEntreprise>>(
    '/api/config/identite-entreprise',
  )
  return data.data as IdentiteEntreprise
}

export async function modifierIdentiteEntreprise(
  requete: IdentiteEntrepriseRequete,
): Promise<IdentiteEntreprise> {
  const { data } = await apiClient.put<ApiResponse<IdentiteEntreprise>>(
    '/api/config/identite-entreprise',
    requete,
  )
  return data.data as IdentiteEntreprise
}

export async function televerserLogoEntreprise(logo: File): Promise<IdentiteEntreprise> {
  const formData = new FormData()
  formData.append('logo', logo)
  const { data } = await apiClient.post<ApiResponse<IdentiteEntreprise>>(
    '/api/config/identite-entreprise/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data as IdentiteEntreprise
}

export async function chargerLogoEntreprise(): Promise<string> {
  const { data } = await apiClient.get<Blob>('/api/config/identite-entreprise/logo', {
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

export async function televerserSignatureEntreprise(signature: File): Promise<IdentiteEntreprise> {
  const formData = new FormData()
  formData.append('signature', signature)
  const { data } = await apiClient.post<ApiResponse<IdentiteEntreprise>>(
    '/api/config/identite-entreprise/signature',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data as IdentiteEntreprise
}

export async function chargerSignatureEntreprise(): Promise<string> {
  const { data } = await apiClient.get<Blob>('/api/config/identite-entreprise/signature', {
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}
