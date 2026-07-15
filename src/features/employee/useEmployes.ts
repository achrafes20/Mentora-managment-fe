import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attacherDocumentEmploye,
  creerEmploye,
  desactiverEmploye,
  type EmployeModificationRequete,
  type EmployeRequete,
  type FiltresEmployes,
  historiqueTransfertsEmploye,
  listerDocumentsEmploye,
  listerEmployes,
  modifierEmploye,
  obtenirEmploye,
  televerserPhotoEmploye,
  transfererEmploye,
  supprimerDocumentEmploye,
  remplacerDocumentEmploye,
  envoyerCarteParEmail,
  type TransfertRequete,
  type DesactivationRequete,
} from './employesApi'

export const CLE_EMPLOYES = ['employes'] as const

function cleDetail(id: string) {
  return ['employes', id] as const
}

export function useEmployes(filtres: FiltresEmployes) {
  return useQuery({ queryKey: [...CLE_EMPLOYES, filtres], queryFn: () => listerEmployes(filtres) })
}

export function useEmploye(id: string | undefined) {
  return useQuery({
    queryKey: cleDetail(id ?? ''),
    queryFn: () => obtenirEmploye(id as string),
    enabled: !!id,
  })
}

export function useDocumentsEmploye(id: string | undefined) {
  return useQuery({
    queryKey: [...cleDetail(id ?? ''), 'documents'],
    queryFn: () => listerDocumentsEmploye(id as string),
    enabled: !!id,
  })
}

export function useHistoriqueTransferts(id: string | undefined) {
  return useQuery({
    queryKey: [...cleDetail(id ?? ''), 'transferts'],
    queryFn: () => historiqueTransfertsEmploye(id as string),
    enabled: !!id,
  })
}

export function useCreerEmploye() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: EmployeRequete) => creerEmploye(requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES }),
  })
}

export function useModifierEmploye(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: EmployeModificationRequete) => modifierEmploye(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
      queryClient.invalidateQueries({ queryKey: cleDetail(id) })
    },
  })
}

export function useTransfererEmploye(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: TransfertRequete) => transfererEmploye(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
      queryClient.invalidateQueries({ queryKey: cleDetail(id) })
    },
  })
}

export function useDesactiverEmploye(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: DesactivationRequete) => desactiverEmploye(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
      queryClient.invalidateQueries({ queryKey: cleDetail(id) })
    },
  })
}

export function useAttacherDocument(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fichier, typeDocument }: { fichier: File; typeDocument: string }) =>
      attacherDocumentEmploye(id, fichier, typeDocument),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...cleDetail(id), 'documents'] }),
  })
}

export function useTeleverserPhoto(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photo: File) => televerserPhotoEmploye(id, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
      queryClient.invalidateQueries({ queryKey: cleDetail(id) })
    },
  })
}

export function useSupprimerDocument(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => supprimerDocumentEmploye(id, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...cleDetail(id), 'documents'] }),
  })
}

export function useRemplacerDocument(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, fichier }: { documentId: string; fichier: File }) =>
      remplacerDocumentEmploye(id, documentId, fichier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...cleDetail(id), 'documents'] }),
  })
}

export function useEnvoyerCarteEmail(id: string) {
  return useMutation({
    mutationFn: (payload: { objet: string; corps: string; destinataire?: string }) =>
      envoyerCarteParEmail(id, payload),
  })
}
