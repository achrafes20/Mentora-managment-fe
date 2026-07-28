import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsAdmin, getDashboardStatsManager } from './dashboardApi'

export const CLE_DASHBOARD_ADMIN = ['dashboard', 'stats', 'admin'] as const
export const CLE_DASHBOARD_MANAGER = ['dashboard', 'stats', 'manager'] as const

/**
 * EF-DASH-01 : statistiques Admin, rafraîchies à chaque chargement (EF-DASH-04).
 * staleTime=0 → TanStack Query revalide à chaque montage du composant.
 */
export function useDashboardStatsAdmin() {
  return useQuery({
    queryKey: CLE_DASHBOARD_ADMIN,
    queryFn: getDashboardStatsAdmin,
    staleTime: 0,
  })
}

/**
 * EF-DASH-02 : statistiques Manager, rafraîchies à chaque chargement (EF-DASH-04).
 */
export function useDashboardStatsManager() {
  return useQuery({
    queryKey: CLE_DASHBOARD_MANAGER,
    queryFn: getDashboardStatsManager,
    staleTime: 0,
  })
}
