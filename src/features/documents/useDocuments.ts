import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listerEnvoisDocuments,
  envoyerCertificatStage,
  envoyerCertificatTravail,
  envoyerDocumentLibre,
  listerSurveillance,
  renvoyerDocumentSurveillance,
} from './documentsApi'

export function useEnvoisDocuments(employeId: string | undefined) {
  return useQuery({
    queryKey: ['employes', employeId, 'envois_documents'],
    queryFn: () => listerEnvoisDocuments(employeId!),
    enabled: !!employeId,
  })
}

export function useEnvoyerCertificatStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeId: string) => envoyerCertificatStage(employeId),
    onSuccess: (_, employeId) => {
      queryClient.invalidateQueries({ queryKey: ['employes', employeId, 'envois_documents'] })
    },
  })
}

export function useEnvoyerCertificatTravail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeId: string) => envoyerCertificatTravail(employeId),
    onSuccess: (_, employeId) => {
      queryClient.invalidateQueries({ queryKey: ['employes', employeId, 'envois_documents'] })
    },
  })
}

export function useEnvoyerDocumentLibre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeId, fichier }: { employeId: string; fichier: File }) =>
      envoyerDocumentLibre(employeId, fichier),
    onSuccess: (_, { employeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employes', employeId, 'envois_documents'] })
    },
  })
}

export function useSurveillance() {
  return useQuery({
    queryKey: ['surveillance'],
    queryFn: listerSurveillance,
  })
}

export function useRenvoyerDocumentSurveillance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notifId: string) => renvoyerDocumentSurveillance(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance'] })
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
  })
}
