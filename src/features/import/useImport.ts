import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/lib/apiClient'
import {
  analyserImport,
  detailLotImport,
  executerImport,
  historiqueImports,
  previsualiserImport,
  type FiltresHistoriqueImport,
  type ImportApercu,
  type ImportCible,
  type ImportRapport,
} from './importApi'

export const CLE_HISTORIQUE_IMPORTS = ['import', 'historique'] as const

interface RequeteMapping {
  fichier: File
  cible: ImportCible
  mapping: Record<string, number>
}

export function usePrevisualiserImport() {
  return useMutation<ImportApercu, ApiError, { fichier: File; cible: ImportCible }>({
    mutationFn: ({ fichier, cible }) => previsualiserImport(fichier, cible),
  })
}

export function useAnalyserImport() {
  return useMutation<ImportRapport, ApiError, RequeteMapping>({
    mutationFn: ({ fichier, cible, mapping }) => analyserImport(fichier, cible, mapping),
  })
}

export function useExecuterImport() {
  const queryClient = useQueryClient()
  return useMutation<ImportRapport, ApiError, RequeteMapping>({
    mutationFn: ({ fichier, cible, mapping }) => executerImport(fichier, cible, mapping),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE_IMPORTS }),
  })
}

export function useHistoriqueImports(filtres: FiltresHistoriqueImport) {
  return useQuery({
    queryKey: [...CLE_HISTORIQUE_IMPORTS, filtres],
    queryFn: () => historiqueImports(filtres),
  })
}

export function useDetailLotImport(lotId: string | undefined) {
  return useQuery({
    queryKey: [...CLE_HISTORIQUE_IMPORTS, lotId],
    queryFn: () => detailLotImport(lotId as string),
    enabled: !!lotId,
  })
}
