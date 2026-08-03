import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import { getDashboardStatsAdmin, getDashboardStatsManager } from './dashboardApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)

// EF-DASH-01 vs EF-DASH-02 : deux endpoints distincts selon le role (perimetre Admin global vs
// Manager restreint) — un copier-coller les ferait silencieusement pointer vers le meme chemin.
describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('la vue Admin et la vue Manager appellent des endpoints distincts', async () => {
    getMock.mockResolvedValue({
      data: {
        data: {
          employesActifs: 0,
          demandesEnAttente: 0,
          anomaliesDuJour: 0,
          repartitionParDepartement: null,
          candidaturesEnCours: null,
          finContratDans7Jours: null,
        },
      },
    })

    await getDashboardStatsAdmin()
    expect(getMock).toHaveBeenLastCalledWith('/api/dashboard/stats')

    await getDashboardStatsManager()
    expect(getMock).toHaveBeenLastCalledWith('/api/dashboard/stats/manager')
  })
})
