import { apiClient, setAuthToken } from '@/lib/apiClient'

// ---- Types alignés sur le backend ----

export type RoleUtilisateur = 'admin' | 'manager'
export type StatutActifInactif = 'actif' | 'inactif'

export interface UserResponse {
  id: string
  email: string
  role: RoleUtilisateur
  nom: string
  prenom: string
  statut: StatutActifInactif
  creeLe: string
  modifieLe: string
}

export interface LoginResponse {
  token: string
  user: UserResponse
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: string | null
  timestamp: string
}

// ---- Auth API ----

export async function login(email: string, motDePasse: string): Promise<LoginResponse> {
  const res = await apiClient.post<ApiEnvelope<LoginResponse>>('/api/auth/login', {
    email,
    motDePasse,
  })
  return res.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<ApiEnvelope<UserResponse>>('/api/auth/me')
  return res.data.data
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', { email })
}

export async function resetPassword(token: string, nouveauMotDePasse: string): Promise<void> {
  await apiClient.post('/api/auth/reset-password', { token, nouveauMotDePasse })
}

// ---- Users API (Admin) ----

export async function listUsers(): Promise<UserResponse[]> {
  const res = await apiClient.get<ApiEnvelope<UserResponse[]>>('/api/users')
  return res.data.data
}

export async function createUser(data: {
  email: string
  motDePasse: string
  role: RoleUtilisateur
  nom: string
  prenom: string
}): Promise<UserResponse> {
  const res = await apiClient.post<ApiEnvelope<UserResponse>>('/api/users', data)
  return res.data.data
}

export async function updateUser(
  id: string,
  data: { role: RoleUtilisateur; nom: string; prenom: string },
): Promise<UserResponse> {
  const res = await apiClient.put<ApiEnvelope<UserResponse>>(`/api/users/${id}`, data)
  return res.data.data
}

export async function deactivateUser(id: string): Promise<UserResponse> {
  const res = await apiClient.patch<ApiEnvelope<UserResponse>>(`/api/users/${id}/deactivate`)
  return res.data.data
}

export async function activateUser(id: string): Promise<UserResponse> {
  const res = await apiClient.patch<ApiEnvelope<UserResponse>>(`/api/users/${id}/activate`)
  return res.data.data
}

// ---- Helpers ----
export { setAuthToken }
