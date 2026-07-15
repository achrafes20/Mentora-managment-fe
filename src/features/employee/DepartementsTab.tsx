import { Plus } from 'lucide-react'
import { useState } from 'react'
import { StatusTag } from '@/components/ui/StatusTag'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import { useAuth } from '../../lib/AuthContext'
import type { ApiError } from '../../lib/apiClient'
import type { Departement, DepartementRequete } from './api'
import { DepartementFormModal, type DepartementFormValues } from './DepartementFormModal'
import {
  useActiverDepartement,
  useCreerDepartement,
  useDepartements,
  useDesactiverDepartement,
  useModifierDepartement,
} from './useDepartements'
import { libelleManager, useManagers } from './useManagers'

export function DepartementsTab() {
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const { data: departements, isLoading, error } = useDepartements()
  const { data: managers } = useManagers()
  const creerMutation = useCreerDepartement()
  const modifierMutation = useModifierDepartement()
  const desactiverMutation = useDesactiverDepartement()
  const activerMutation = useActiverDepartement()

  const [modalOuvert, setModalOuvert] = useState(false)
  const [departementEnEdition, setDepartementEnEdition] = useState<Departement | null>(null)
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null)

  function ouvrirCreation() {
    setDepartementEnEdition(null)
    setErreurFormulaire(null)
    setModalOuvert(true)
  }

  function ouvrirEdition(depart: Departement) {
    setDepartementEnEdition(depart)
    setErreurFormulaire(null)
    setModalOuvert(true)
  }

  function fermerModal() {
    setModalOuvert(false)
    setErreurFormulaire(null)
  }

  function soumettre(values: DepartementFormValues) {
    const requete: DepartementRequete = {
      nom: values.nom,
      managerId: values.managerId || undefined,
    }
    const promesse = departementEnEdition
      ? modifierMutation.mutateAsync({ id: departementEnEdition.id as string, requete })
      : creerMutation.mutateAsync(requete)

    promesse
      .then(() => {
        toast.success(departementEnEdition ? 'Département modifié' : 'Département créé')
        fermerModal()
      })
      .catch((err: ApiError) => setErreurFormulaire(err.message))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-[#6B7280]">
          {departements?.length ?? 0} département{(departements?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        {estAdmin && (
          <button
            onClick={ouvrirCreation}
            className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#243650]"
          >
            <Plus size={13} /> Nouveau département
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[13px] text-[#C1495A]">
          Impossible de charger les départements
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : (departements?.length ?? 0) === 0 ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Aucun département.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Nom', 'Manager', 'Statut', ...(estAdmin ? ['Actions'] : [])].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departements!.map((depart) => {
                const manager = managers?.find((m) => m.id === depart.managerId)
                return (
                  <tr
                    key={depart.id}
                    className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                  >
                    <td className="py-3.5 pr-4 pl-5 text-[13px] font-medium text-[#1B2A41]">
                      {depart.nom}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                      {manager ? libelleManager(manager) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusTag statut={depart.statut === 'actif' ? 'Actif' : 'Inactif'} />
                    </td>
                    {estAdmin && (
                      <td className="py-3.5 pr-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => ouvrirEdition(depart)}
                            className="rounded-lg border border-[#D8D4CC] px-2.5 py-1 text-[11px] text-[#1B2A41] hover:border-[#1B2A41]"
                          >
                            Modifier
                          </button>
                          {depart.statut === 'inactif' ? (
                            <button
                              onClick={() =>
                                depart.id &&
                                activerMutation.mutate(depart.id, {
                                  onError: (err) => toast.error(err.message),
                                })
                              }
                              className="rounded-lg border border-[#4A7C6B]/30 px-2.5 py-1 text-[11px] text-[#4A7C6B] hover:bg-[#4A7C6B]/8"
                            >
                              Activer
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                confirm({
                                  title: 'Désactiver ce département ?',
                                  content: 'Bloqué si des employés actifs y sont encore rattachés.',
                                  okText: 'Désactiver',
                                  cancelText: 'Annuler',
                                  danger: true,
                                  onOk: () => {
                                    if (!depart.id) return
                                    desactiverMutation.mutate(depart.id, {
                                      onError: (err) => toast.error(err.message),
                                    })
                                  },
                                })
                              }}
                              className="rounded-lg border border-[#C1495A]/30 px-2.5 py-1 text-[11px] text-[#C1495A] hover:bg-[#C1495A]/8"
                            >
                              Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <DepartementFormModal
        open={modalOuvert}
        depart={departementEnEdition}
        managers={managers ?? []}
        onCancel={fermerModal}
        onSubmit={soumettre}
        submitting={creerMutation.isPending || modifierMutation.isPending}
        errorMessage={erreurFormulaire}
      />
    </div>
  )
}
