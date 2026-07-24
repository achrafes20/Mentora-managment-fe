import { apiClient } from '@/lib/apiClient'
import type { components } from '@/types/api'

export type JournalAuditEntree = components['schemas']['JournalAuditReponse']
export type ModuleAudit = NonNullable<JournalAuditEntree['module']>

export interface PageJournalAudit {
  content: JournalAuditEntree[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface FiltresAudit {
  module?: ModuleAudit
  utilisateurId?: string
  debut?: string
  fin?: string
  recherche?: string
  page?: number
  size?: number
}

interface ApiResponse<T> {
  data?: T
}

const PAGE_VIDE: PageJournalAudit = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  last: true,
}

export async function rechercherAudit(filtres: FiltresAudit): Promise<PageJournalAudit> {
  const { data } = await apiClient.get<ApiResponse<PageJournalAudit>>('/api/audit', {
    params: {
      module: filtres.module || undefined,
      utilisateurId: filtres.utilisateurId || undefined,
      debut: filtres.debut || undefined,
      fin: filtres.fin || undefined,
      recherche: filtres.recherche || undefined,
      page: filtres.page ?? 0,
      size: filtres.size ?? 20,
    },
  })
  return data.data ?? PAGE_VIDE
}
