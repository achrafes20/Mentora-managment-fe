import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changerStatutCandidature,
  creerCandidatureManuelle,
  creerOffre,
  enregistrerResultatEntretien,
  fermerOffre,
  listerCandidatures,
  listerEntretiens,
  listerOffres,
  modifierOffre,
  obtenirCandidature,
  obtenirOffre,
  relancerAnalyseCandidature,
  reprogrammerEntretien,
  rouvrirOffre,
  validerReactivationCandidature,
  type ChangerStatutRequete,
  type FiltresCandidatures,
  type OffreEmploiRequete,
  type ReprogrammerEntretienRequete,
  type ResultatEntretienRequete,
} from './recruitmentApi'

export const CLE_OFFRES = ['offres'] as const
export const CLE_CANDIDATURES = ['candidatures'] as const

function cleOffre(id: string) {
  return ['offres', id] as const
}

function cleCandidature(id: string) {
  return ['candidatures', id] as const
}

export function useOffres(statut?: string, categorie?: string) {
  return useQuery({
    queryKey: [...CLE_OFFRES, statut, categorie],
    queryFn: () => listerOffres(statut, categorie),
  })
}

export function useOffre(id: string | undefined) {
  return useQuery({
    queryKey: cleOffre(id ?? ''),
    queryFn: () => obtenirOffre(id as string),
    enabled: !!id,
  })
}

export function useCreerOffre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: OffreEmploiRequete) => creerOffre(requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_OFFRES })
      // EF-REC-12 : la création peut réactiver des candidatures "en_attente".
      queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES })
    },
  })
}

export function useModifierOffre(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: OffreEmploiRequete) => modifierOffre(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_OFFRES })
      queryClient.invalidateQueries({ queryKey: cleOffre(id) })
    },
  })
}

export function useFermerOffre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fermerOffre(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_OFFRES }),
  })
}

export function useRouvrirOffre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rouvrirOffre(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_OFFRES }),
  })
}

export function useCandidatures(filtres: FiltresCandidatures) {
  return useQuery({
    queryKey: [...CLE_CANDIDATURES, filtres],
    queryFn: () => listerCandidatures(filtres),
  })
}

export function useCreerCandidatureManuelle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: creerCandidatureManuelle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES }),
  })
}

export function useCandidature(id: string | undefined) {
  return useQuery({
    queryKey: cleCandidature(id ?? ''),
    queryFn: () => obtenirCandidature(id as string),
    enabled: !!id,
  })
}

export function useChangerStatutCandidature(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: ChangerStatutRequete) => changerStatutCandidature(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES })
      queryClient.invalidateQueries({ queryKey: cleCandidature(id) })
    },
  })
}

export function useRelancerAnalyse(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => relancerAnalyseCandidature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES })
      queryClient.invalidateQueries({ queryKey: cleCandidature(id) })
    },
  })
}

export function useValiderReactivation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => validerReactivationCandidature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_CANDIDATURES })
      queryClient.invalidateQueries({ queryKey: cleCandidature(id) })
    },
  })
}

export function useReprogrammerEntretien(candidatureId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: ReprogrammerEntretienRequete) =>
      reprogrammerEntretien(candidatureId, requete),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...cleCandidature(candidatureId), 'entretiens'],
      }),
  })
}

export function useEntretiens(candidatureId: string | undefined) {
  return useQuery({
    queryKey: [...cleCandidature(candidatureId ?? ''), 'entretiens'],
    queryFn: () => listerEntretiens(candidatureId as string),
    enabled: !!candidatureId,
  })
}

export function useEnregistrerResultatEntretien(candidatureId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requete: ResultatEntretienRequete) =>
      enregistrerResultatEntretien(candidatureId, requete),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...cleCandidature(candidatureId), 'entretiens'],
      }),
  })
}
