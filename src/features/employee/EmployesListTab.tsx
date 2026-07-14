import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Square,
  X,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import type { ApiError } from '../../lib/apiClient'
import { EmployeFormModal, type EmployeFormValues } from './EmployeFormModal'
import { useDepartements } from './useDepartements'
import { useQueryClient } from '@tanstack/react-query'
import { useCreerEmploye, useEmployes, CLE_EMPLOYES } from './useEmployes'
import { useManagers } from './useManagers'
import type { Employe, FiltresEmployes } from './employesApi'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import { message } from 'antd'
import { televerserPhotoEmploye } from './employesApi'
import { useEmployePhotoUrl } from './useEmployePhoto'

const TYPES_CONTRAT = ['CDI', 'CDD', 'STAGIAIRE', 'STAGIAIRE_REMUNERE']

function EmployeListAvatar({ emp }: { emp: Employe }) {
  const photoUrl = useEmployePhotoUrl(emp.id, emp.photoFichierId)
  return <Avatar prenom={emp.prenom ?? ''} nom={emp.nom ?? ''} photoUrl={photoUrl} />
}

export function EmployesListTab() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const estAdmin = role === 'admin'
  const { data: departements } = useDepartements()
  const { data: managers } = useManagers()
  const [filtres, setFiltres] = useState<FiltresEmployes>({ page: 0, size: 50 })
  const [modaleCreation, setModaleCreation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showExport, setShowExport] = useState(false)

  const queryClient = useQueryClient()
  const { data: page, isLoading } = useEmployes(filtres)
  const creerMutation = useCreerEmploye()
  const employes = page?.content ?? []
  const total = page?.totalElements ?? 0

  function majFiltre(patch: Partial<FiltresEmployes>) {
    setFiltres((precedent) => ({ ...precedent, ...patch, page: 0 }))
  }

  function creerEmploye(valeurs: EmployeFormValues, photo?: File | null) {
    creerMutation
      .mutateAsync({
        nom: valeurs.nom,
        prenom: valeurs.prenom,
        email: valeurs.email || undefined,
        telephone: valeurs.telephone || undefined,
        poste: valeurs.poste || undefined,
        departementId: valeurs.departementId,
        managerId: valeurs.managerId || undefined,
        dateEmbauche: valeurs.dateEmbauche.format('YYYY-MM-DD'),
        typeContrat: valeurs.typeContrat,
        dateFinContratPrevue: valeurs.dateFinContratPrevue
          ? valeurs.dateFinContratPrevue.format('YYYY-MM-DD')
          : undefined,
      })
      .then(async (employe) => {
        if (photo && employe.id) {
          await televerserPhotoEmploye(employe.id, photo)
          await queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
        }
        void message.success('Employé créé — carte badge générée.')
        setModaleCreation(false)
        setErreur(null)
      })
      .catch((err: ApiError) => setErreur(err.message))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="relative p-8">
      {modaleCreation && (
        <EmployeFormModal
          open
          mode="creation"
          departements={departements ?? []}
          managers={managers ?? []}
          onCancel={() => setModaleCreation(false)}
          onSubmit={creerEmploye}
          submitting={creerMutation.isPending}
          errorMessage={erreur}
        />
      )}

      <PageHeader
        title="Employés"
        subtitle={`${total} employé${total !== 1 ? 's' : ''}`}
        actions={
          estAdmin && (
            <>
              <button
                onClick={() => navigate('/import')}
                className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
              >
                <FileSpreadsheet size={13} /> Importer
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExport((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                >
                  <Download size={13} /> Exporter
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
                    {['Excel (.xlsx)', 'PDF'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setShowExport(false)}
                        className="block w-full px-4 py-2.5 text-left text-[12px] text-[#1B2A41] transition-colors hover:bg-[#F7F7F4]"
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectionMode((v) => !v)
                  setSelected(new Set())
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] transition-colors ${
                  selectionMode
                    ? 'border-[#1B2A41] bg-[#1B2A41]/8 text-[#1B2A41]'
                    : 'border-[#D8D4CC] text-[#6B7280] hover:border-[#1B2A41] hover:text-[#1B2A41]'
                }`}
              >
                <CheckSquare size={13} /> {selectionMode ? 'Annuler' : 'Sélectionner'}
              </button>
              <button
                onClick={() => setModaleCreation(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#243650]"
              >
                <Plus size={13} /> Ajouter un employé
              </button>
            </>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={filtres.recherche ?? ''}
            onChange={(e) => majFiltre({ recherche: e.target.value || undefined })}
            placeholder="Rechercher par nom, prénom, e-mail…"
            className="w-full rounded-lg border border-[#D8D4CC] bg-white py-2 pr-4 pl-9 text-[13px] focus:border-[#1B2A41] focus:outline-none"
          />
        </div>
        <select
          value={filtres.departementId ?? ''}
          onChange={(e) => majFiltre({ departementId: e.target.value || undefined })}
          className="min-w-[160px] cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280] focus:border-[#1B2A41] focus:outline-none"
        >
          <option value="">Tous les départements</option>
          {departements?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>
        <select
          value={filtres.typeContrat ?? ''}
          onChange={(e) => majFiltre({ typeContrat: e.target.value || undefined })}
          className="cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280] focus:border-[#1B2A41] focus:outline-none"
        >
          <option value="">Tous les contrats</option>
          {TYPES_CONTRAT.map((t) => (
            <option key={t} value={t}>
              {formatStatut(t)}
            </option>
          ))}
        </select>
        <select
          value={filtres.statut ?? ''}
          onChange={(e) => majFiltre({ statut: e.target.value || undefined })}
          className="cursor-pointer rounded-lg border border-[#D8D4CC] bg-white px-3 py-2 text-[13px] text-[#6B7280] focus:border-[#1B2A41] focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {selectionMode && <th className="w-8 pl-4 py-3" />}
                {['Matricule', 'Employé', 'Poste', 'Département', 'Contrat', 'Statut', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {employes.map((emp: Employe) => (
                <tr
                  key={emp.id}
                  onClick={() =>
                    selectionMode ? toggleSelect(emp.id!) : navigate(`/employes/${emp.id}`)
                  }
                  className={`cursor-pointer border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4] group ${
                    selected.has(emp.id!) ? 'bg-[#1B2A41]/4' : ''
                  }`}
                >
                  {selectionMode && (
                    <td
                      className="pl-4 py-3.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(emp.id!)
                      }}
                    >
                      {selected.has(emp.id!) ? (
                        <CheckSquare size={14} className="text-[#1B2A41]" />
                      ) : (
                        <Square size={14} className="text-[#D8D4CC]" />
                      )}
                    </td>
                  )}
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="pl-5 pr-4 py-3.5 text-[11px] text-[#9CA3AF]"
                  >
                    {emp.id?.substring(0, 8)}…
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <EmployeListAvatar emp={emp} />
                      <span className="text-[13px] font-medium text-[#1B2A41]">
                        {emp.prenom} {emp.nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">{emp.poste ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                    {emp.departementNom ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      style={{ fontFamily: 'var(--font-code)' }}
                      className="rounded bg-[#4A7C6B]/8 px-1.5 py-0.5 text-[11px] text-[#4A7C6B]"
                    >
                      {formatStatut(emp.typeContrat ?? '')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={formatStatut(emp.statut ?? '')} />
                  </td>
                  <td className="pr-5 py-3.5 text-right">
                    <ChevronRight
                      size={14}
                      className="ml-auto text-[#D8D4CC] transition-colors group-hover:text-[#9CA3AF]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectionMode && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-[#1B2A41] px-5 py-3 text-white shadow-2xl">
          <span className="text-[13px] font-medium">
            {selected.size} employé{selected.size > 1 ? 's' : ''} sélectionné
            {selected.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              setSelectionMode(false)
              setSelected(new Set())
            }}
            className="text-white/50 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
