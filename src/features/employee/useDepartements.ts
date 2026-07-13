import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '../../lib/apiClient'
import {
  activerDepartement,
  creerDepartement,
  type Departement,
  desactiverDepartement,
  listerDepartements,
  modifierDepartement,
  type DepartementRequete,
} from './api'
import { CLE_EMPLOYES } from './useEmployes'

const CLE_DEPARTEMENTS = ['departements'] as const

export function useDepartements() {
  return useQuery({ queryKey: CLE_DEPARTEMENTS, queryFn: listerDepartements })
}

export function useCreerDepartement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: creerDepartement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS }),
  })
}

export function useModifierDepartement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, requete }: { id: string; requete: DepartementRequete }) =>
      modifierDepartement(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS })
      // EmployeReponse embarque departementNom (jointure côté serveur) : un renommage
      // rend le cache employés obsolète tant qu'on ne l'invalide pas aussi.
      queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
    },
  })
}

export function useDesactiverDepartement() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: desactiverDepartement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS }),
  })
}

export function useActiverDepartement() {
  const queryClient = useQueryClient()
  return useMutation<Departement, ApiError, string>({
    mutationFn: activerDepartement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS }),
  })
}
