import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listerEnvoisDocuments,
  apercuCertificatStage,
  apercuCertificatTravail,
  apercuAttestationTravail,
  apercuAttestationSalaire,
  envoyerCertificatStage,
  envoyerCertificatTravail,
  envoyerAttestationTravail,
  envoyerAttestationSalaire,
  envoyerDocumentLibre,
  executerSurveillance,
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

export function useApercuCertificatStage() {
  return useMutation({
    mutationFn: ({ employeId, sujetStage }: { employeId: string; sujetStage?: string }) =>
      apercuCertificatStage(employeId, sujetStage),
  })
}

export function useApercuCertificatTravail() {
  return useMutation({
    mutationFn: (employeId: string) => apercuCertificatTravail(employeId),
  })
}

export function useApercuAttestationTravail() {
  return useMutation({
    mutationFn: (employeId: string) => apercuAttestationTravail(employeId),
  })
}

export function useEnvoyerCertificatStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeId, sujetStage }: { employeId: string; sujetStage?: string }) =>
      envoyerCertificatStage(employeId, sujetStage),
    onSuccess: (_, { employeId }) => {
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

export function useEnvoyerAttestationTravail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeId: string) => envoyerAttestationTravail(employeId),
    onSuccess: (_, employeId) => {
      queryClient.invalidateQueries({ queryKey: ['employes', employeId, 'envois_documents'] })
    },
  })
}

export function useApercuAttestationSalaire() {
  return useMutation({
    mutationFn: (employeId: string) => apercuAttestationSalaire(employeId),
  })
}

export function useEnvoyerAttestationSalaire() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeId: string) => envoyerAttestationSalaire(employeId),
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

export function useSurveillance(page = 0, size = 10, jours = 10) {
  return useQuery({
    queryKey: ['surveillance', page, size, jours],
    queryFn: () => listerSurveillance(page, size, jours),
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

export function useExecuterSurveillance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: executerSurveillance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance'] })
    },
  })
}
