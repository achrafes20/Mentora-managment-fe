export const featureFlags = {
  /** Modules avec backend implémenté */
  auth: true,
  employees: true,
  attendance: true,
  import: true,
  dashboard: true,
  recruitment: true,
  adminRequests: true,
  documents: true,
  config: true,
  delegation: true,
  notifications: true,
  audit: true,
} as const

export type FeatureKey = keyof typeof featureFlags

export function useMockData(feature: FeatureKey): boolean {
  return !featureFlags[feature]
}
