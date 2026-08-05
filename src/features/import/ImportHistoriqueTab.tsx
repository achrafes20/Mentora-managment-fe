import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import { Spinner } from '@/components/ui/Spinner'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { RapportTable } from './RapportTable'
import { useDetailLotImport, useHistoriqueImports } from './useImport'

const CIBLE_LABELS: Record<string, string> = {
  DEPARTEMENTS: 'Départements',
  EMPLOYES: 'Employés',
  SOLDES_CONGES_INITIAUX: 'Soldes de congés initiaux',
}

export function ImportHistoriqueTab() {
  const [page, setPage] = useState(0)
  const [lotSelectionne, setLotSelectionne] = useState<string | null>(null)
  const { data, isLoading } = useHistoriqueImports({ page, size: 20 })
  const { trie, tri, handleTri } = useTriLocal(
    data?.content,
    (lot, champ) => lot[champ as keyof typeof lot] as string | number | boolean | null | undefined,
    { champ: 'creeLe', direction: 'desc' },
  )

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : !data || (data.content?.length ?? 0) === 0 ? (
        <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
          Aucun import réalisé pour l'instant.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D8D4CC] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                <SortableTh label="Date" champ="creeLe" tri={tri} onChange={handleTri} />
                <SortableTh label="Cible" champ="cible" tri={tri} onChange={handleTri} />
                <SortableTh label="Mode" champ="mode" tri={tri} onChange={handleTri} />
                <SortableTh label="Fichier" champ="nomFichier" tri={tri} onChange={handleTri} />
                <SortableTh
                  label="Valides"
                  champ="nbLignesValides"
                  tri={tri}
                  onChange={handleTri}
                />
                <SortableTh label="Erreurs" champ="nbLignesErreur" tri={tri} onChange={handleTri} />
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase" />
              </tr>
            </thead>
            <tbody>
              {trie.map((lot) => (
                <tr key={lot.id} className="border-b border-[#D8D4CC]/50">
                  <td className="px-4 py-3 text-[13px] text-[#1B2A41]">
                    {lot.creeLe
                      ? format(new Date(lot.creeLe), 'dd MMM yyyy HH:mm', { locale: fr })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1B2A41]">
                    {CIBLE_LABELS[lot.cible ?? ''] ?? lot.cible}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag statut={formatStatut(lot.mode ?? '')} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1B2A41]">{lot.nomFichier}</td>
                  <td className="px-4 py-3 text-[13px] text-[#4A7C6B]">{lot.nbLignesValides}</td>
                  <td className="px-4 py-3 text-[13px] text-[#C1495A]">{lot.nbLignesErreur}</td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => setLotSelectionne(lot.id ?? null)}>
                      Détail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#D8D4CC] px-4 py-3">
            <span className="text-[12px] text-[#6B7280]">
              Page {(data.page ?? 0) + 1} sur {Math.max(data.totalPages ?? 1, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="secondary"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}

      <DetailLotDialog lotId={lotSelectionne} onClose={() => setLotSelectionne(null)} />
    </div>
  )
}

function DetailLotDialog({ lotId, onClose }: { lotId: string | null; onClose: () => void }) {
  const { data, isLoading } = useDetailLotImport(lotId ?? undefined)
  return (
    <Dialog
      open={!!lotId}
      onOpenChange={(open) => !open && onClose()}
      title="Détail de l'import"
      width={720}
    >
      {isLoading || !data ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <RapportTable lignes={data.lignes ?? []} />
      )}
    </Dialog>
  )
}
