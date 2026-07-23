import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUsers } from '@/lib/authApi'
import {
  creerDelegation,
  listerDelegations,
  obtenirMaDelegationActive,
  revoquerDelegation,
  type DelegationCreationRequete,
} from './delegationApi'

export const CLE_DELEGATIONS = ['delegations'] as const
const CLE_UTILISATEURS = ['utilisateurs-delegation'] as const
const CLE_MA_DELEGATION = ['ma-delegation-active'] as const

/** Comptes admin/manager pour la fiche délégation — liste complète (historique) + picker filtré. */
export function useUtilisateursPourDelegation() {
  return useQuery({ queryKey: CLE_UTILISATEURS, queryFn: listUsers })
}

/** Historique complet — Admin uniquement côté backend (GET /api/delegations), pour DelegationPage. */
export function useDelegations() {
  return useQuery({ queryKey: CLE_DELEGATIONS, queryFn: listerDelegations })
}

export function useDelegationActive() {
  const { data, ...rest } = useDelegations()
  return { data: data?.find((d) => d.statut === 'active'), ...rest }
}

/**
 * Ma délégation active en tant que délégué (GET /api/delegations/moi) — le seul appel qu'un
 * Manager est autorisé à faire pour connaître son propre statut de délégué (l'historique complet
 * ci-dessus renvoie 403 pour lui). Le backend ne renvoie une délégation que si sa période a
 * réellement commencé (estEffectivementActive()), donc jamais pour une délégation planifiée.
 */
export function useMaDelegationActive() {
  return useQuery({ queryKey: CLE_MA_DELEGATION, queryFn: obtenirMaDelegationActive })
}

/**
 * EF-AUTH-11/12 : vrai si l'utilisateur courant est actuellement un délégué actif — les écrans
 * qui affichent des actions d'approbation/décision (Demandes, Recrutement) doivent s'aligner sur
 * ce booléen plutôt que sur `role`, qui ne change jamais pour un Manager délégué.
 */
export function useEstDelegueActifMaintenant(): boolean {
  const { data } = useMaDelegationActive()
  return Boolean(data)
}

export function useCreerDelegation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: DelegationCreationRequete) => creerDelegation(requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_DELEGATIONS })
      queryClient.invalidateQueries({ queryKey: CLE_MA_DELEGATION })
    },
  })
}

export function useRevoquerDelegation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => revoquerDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_DELEGATIONS })
      queryClient.invalidateQueries({ queryKey: CLE_MA_DELEGATION })
    },
  })
}
