import { apiClient } from '@/lib/apiClient'

export interface RepartitionDepartement {
  departementId: string
  nom: string
  count: number
}

/**
 * EF-DASH-01/02 : agrégats du tableau de bord.
 * Les champs candidaturesEnCours / finContratDans7Jours / repartitionParDepartement
 * sont null pour un Manager (vue réduite EF-DASH-02).
 */
export interface DashboardStats {
  employesActifs: number
  demandesEnAttente: number
  anomaliesDuJour: number
  repartitionParDepartement: RepartitionDepartement[] | null
  candidaturesEnCours: number | null
  finContratDans7Jours: number | null
}

interface ApiResponse<T> {
  data: T
}

/** EF-DASH-01 : vue Admin (GET /api/dashboard/stats). */
export async function getDashboardStatsAdmin(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/api/dashboard/stats')
  return data.data
}

/** EF-DASH-02 : vue Manager (GET /api/dashboard/stats/manager). */
export async function getDashboardStatsManager(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/api/dashboard/stats/manager')
  return data.data
}
