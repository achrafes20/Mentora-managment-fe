import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/apiClient'
import {
  creerDelegation,
  listerDelegations,
  obtenirMaDelegationActive,
  revoquerDelegation,
  type Delegation,
} from './delegationApi'

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const postMock = vi.mocked(apiClient.post)

const delegation: Delegation = {
  id: '3a1fac41-7012-4e8e-a730-4a61849124c9',
  adminDelegantId: '2cab0340-8824-49ee-852e-21b1a71c5c5f',
  delegueId: 'd05aaeae-638d-4200-8f73-6390162bc417',
  dateDebut: '2026-07-22',
  dateFin: '2026-07-29',
  statut: 'active',
  revoqueParId: undefined,
  revoqueLe: undefined,
  creeLe: new Date().toISOString(),
}

describe('delegationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listerDelegations appelle GET /api/delegations et retourne [] si data absent', async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(listerDelegations()).resolves.toEqual([])
    expect(getMock).toHaveBeenCalledWith('/api/delegations')
  })

  // EF-AUTH-11/12 : /moi est un endpoint distinct de /api/delegations (historique complet,
  // Admin uniquement) — c'est le seul qu'un Manager délégué est autorisé à appeler pour connaître
  // son propre statut (cf. useEstDelegueActifMaintenant, DelegationController#maDelegation()).
  it('obtenirMaDelegationActive appelle GET /api/delegations/moi', async () => {
    getMock.mockResolvedValueOnce({ data: { data: delegation } })

    await expect(obtenirMaDelegationActive()).resolves.toEqual(delegation)
    expect(getMock).toHaveBeenCalledWith('/api/delegations/moi')
  })

  it("obtenirMaDelegationActive retourne null quand l'utilisateur n'est pas délégué actif", async () => {
    getMock.mockResolvedValueOnce({ data: {} })

    await expect(obtenirMaDelegationActive()).resolves.toBeNull()
  })

  it('creerDelegation poste sur /api/delegations avec la requête fournie', async () => {
    postMock.mockResolvedValueOnce({ data: { data: delegation } })
    // Champs littéraux plutôt que dérivés de `delegation` : ses props sont typées optionnelles
    // (générées depuis l'OpenAPI spec), alors que DelegationCreationRequete les exige toutes.
    const requete = {
      delegueId: 'd05aaeae-638d-4200-8f73-6390162bc417',
      dateDebut: '2026-07-22',
      dateFin: '2026-07-29',
    }

    await expect(creerDelegation(requete)).resolves.toEqual(delegation)
    expect(postMock).toHaveBeenCalledWith('/api/delegations', requete)
  })

  it('revoquerDelegation poste sur /api/delegations/{id}/revoquer', async () => {
    postMock.mockResolvedValueOnce({ data: { data: { ...delegation, statut: 'revoquee' } } })

    await expect(revoquerDelegation(delegation.id as string)).resolves.toMatchObject({
      statut: 'revoquee',
    })
    expect(postMock).toHaveBeenCalledWith(`/api/delegations/${delegation.id}/revoquer`)
  })
})
