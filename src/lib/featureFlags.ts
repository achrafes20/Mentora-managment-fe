export const featureFlags = {
  /** Modules avec backend implémenté */
  auth: true,
  employees: true,
  attendance: true,
  /** Modules frontend-only (mock data) — passer à true quand l'API est prête */
  dashboard: false,
  recruitment: false,
  adminRequests: false,
  documents: false,
  config: false,
  delegation: false,
  notifications: false,
  audit: false,
  import: false,
} as const

export type FeatureKey = keyof typeof featureFlags

export function useMockData(feature: FeatureKey): boolean {
  return !featureFlags[feature]
}
