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
  mattermostUserId: string | null
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

/**
 * Modification de son propre e-mail. Révoque toutes les sessions actives côté backend, y compris
 * celle en cours : l'appelant doit se déconnecter juste après (voir MonCompteDialog) — le jeton en
 * main ne redeviendra pas valide.
 */
export async function changerEmail(nouvelEmail: string): Promise<void> {
  await apiClient.patch('/api/auth/me/email', { nouvelEmail })
}

/** Modification de son propre mot de passe (mot de passe actuel exigé). Révoque les sessions. */
export async function changerMotDePasse(
  motDePasseActuel: string,
  nouveauMotDePasse: string,
): Promise<void> {
  await apiClient.patch('/api/auth/me/password', { motDePasseActuel, nouveauMotDePasse })
}

// ---- Users API (Admin) ----

export async function listUsers(): Promise<UserResponse[]> {
  const res = await apiClient.get<ApiEnvelope<UserResponse[]>>('/api/users')
  return res.data.data
}

/**
 * Comptes Manager actifs uniquement — contrairement à listUsers(), accessible à un délégué actif
 * (EF-AUTH-11/12) : jamais la liste complète des comptes (Admin inclus), qui relèverait de la
 * gestion des comptes utilisateurs, explicitement jamais déléguée.
 */
export async function listManagers(): Promise<UserResponse[]> {
  const res = await apiClient.get<ApiEnvelope<UserResponse[]>>('/api/users/managers')
  return res.data.data
}

export async function createUser(data: {
  email: string
  motDePasse: string
  role: RoleUtilisateur
  nom: string
  prenom: string
  mattermostUserId?: string | null
  // EF-EMP-18 : un Manager est aussi un employé — obligatoires côté backend pour role === 'manager'
  // (fiche RH créée avec le compte), ignorés pour un Admin.
  departementId?: string | null
  poste?: string | null
  typeContrat?: string | null
  dateEmbauche?: string | null
}): Promise<UserResponse> {
  const res = await apiClient.post<ApiEnvelope<UserResponse>>('/api/users', data)
  return res.data.data
}

export async function updateUser(
  id: string,
  data: { role: RoleUtilisateur; nom: string; prenom: string; mattermostUserId?: string | null },
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
