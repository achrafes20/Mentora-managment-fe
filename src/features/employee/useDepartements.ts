import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  creerDepartement,
  desactiverDepartement,
  listerDepartements,
  modifierDepartement,
  type DepartementRequete,
} from './api'

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS }),
  })
}

export function useDesactiverDepartement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: desactiverDepartement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPARTEMENTS }),
  })
}
