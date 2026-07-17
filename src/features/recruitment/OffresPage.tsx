import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import type { ApiError } from '@/lib/apiClient'
import { useDepartements } from '@/features/employee/useDepartements'
import { OffreFormModal, type OffreFormValues } from './OffreFormModal'
import {
  useCandidatures,
  useCreerOffre,
  useFermerOffre,
  useModifierOffre,
  useOffres,
  useRouvrirOffre,
} from './useRecruitment'
import type { OffreEmploi } from './recruitmentApi'

export function OffresPage() {
  const navigate = useNavigate()
  const { data: departements } = useDepartements()
  const { data: offres, isLoading } = useOffres()
  // Comptage des candidatures par offre — un seul appel plutôt qu'une requête par ligne.
  const { data: candidaturesPage } = useCandidatures({ size: 500 })

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [offreEditee, setOffreEditee] = useState<OffreEmploi | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const creerMutation = useCreerOffre()
  const modifierMutation = useModifierOffre(offreEditee?.id ?? '')
  const fermerMutation = useFermerOffre()
  const rouvrirMutation = useRouvrirOffre()

  function departementNom(id?: string) {
    return departements?.find((d) => d.id === id)?.nom ?? '—'
  }

  function nombreCandidatures(offreId?: string) {
    return candidaturesPage?.content?.filter((c) => c.offreId === offreId).length ?? 0
  }

  function ouvrirCreation() {
    setOffreEditee(null)
    setErreur(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(offre: OffreEmploi) {
    setOffreEditee(offre)
    setErreur(null)
    setModaleOuverte(true)
  }

  function soumettre(valeurs: OffreFormValues) {
    const requete = {
      intitule: valeurs.intitule,
      description: valeurs.description || undefined,
      departementId: valeurs.departementId,
      motsClesRequis: valeurs.motsClesRequis
        ? valeurs.motsClesRequis
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean)
        : undefined,
    }
    const mutation = offreEditee ? modifierMutation : creerMutation
    mutation
      .mutateAsync(requete)
      .then(() => {
        toast.success(offreEditee ? 'Offre mise à jour.' : 'Offre créée.')
        setModaleOuverte(false)
      })
      .catch((err: ApiError) => setErreur(err.message))
  }

  function demanderFermeture(offre: OffreEmploi) {
    confirm({
      title: `Fermer l'offre « ${offre.intitule} » ?`,
      content:
        'Les candidatures déjà en cours restent traitables normalement. Toute nouvelle candidature reçue pour cette offre sera conservée "En attente" (EF-REC-11).',
      okText: 'Fermer l’offre',
      onOk: async () => {
        try {
          await fermerMutation.mutateAsync(offre.id as string)
          toast.success('Offre fermée.')
        } catch (err) {
          toast.error((err as ApiError).message)
        }
      },
    })
  }

  async function rouvrir(offre: OffreEmploi) {
    try {
      await rouvrirMutation.mutateAsync(offre.id as string)
      toast.success('Offre rouverte.')
    } catch (err) {
      toast.error((err as ApiError).message)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      {modaleOuverte && (
        <OffreFormModal
          open
          offre={offreEditee}
          departements={departements ?? []}
          onCancel={() => setModaleOuverte(false)}
          onSubmit={soumettre}
          submitting={creerMutation.isPending || modifierMutation.isPending}
          errorMessage={erreur}
        />
      )}

      <button
        onClick={() => navigate('/recrutement')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour au recrutement
      </button>
      <PageHeader
        title="Offres d'emploi"
        subtitle={`${offres?.length ?? 0} offre(s)`}
        actions={
          <button
            onClick={ouvrirCreation}
            className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white"
          >
            + Nouvelle offre
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Intitulé', 'Département', 'Statut', 'Candidatures', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(offres ?? []).map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/recrutement/offres/${o.id}`)}
                  className="cursor-pointer border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                >
                  <td className="px-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">
                    {o.intitule}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                    {departementNom(o.departementId)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={formatStatut(o.statut ?? '')} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                  >
                    {nombreCandidatures(o.id)}
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => ouvrirEdition(o)}
                        className="text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
                      >
                        Modifier
                      </button>
                      {o.statut === 'ouverte' ? (
                        <button
                          onClick={() => demanderFermeture(o)}
                          className="text-[12px] text-[#C1495A] hover:text-[#a53c4b]"
                        >
                          Fermer
                        </button>
                      ) : (
                        <button
                          onClick={() => void rouvrir(o)}
                          className="text-[12px] text-[#4A7C6B] hover:text-[#3d6659]"
                        >
                          Rouvrir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(offres ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                    Aucune offre pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
