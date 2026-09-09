import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { apiClient, type ApiError } from '../../lib/apiClient'
import { basculerTri, SortableTh, type Tri } from '@/components/ui/SortableTh'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { EmployeFormModal, type EmployeFormValues, type EmployePrefill } from './EmployeFormModal'
import { useDepartements } from './useDepartements'
import { useQueryClient } from '@tanstack/react-query'
import { useCreerEmploye, useEmployes, CLE_EMPLOYES } from './useEmployes'
import { useManagers } from './useManagers'
import type { Employe, FiltresEmployes } from './employesApi'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/ui/StatCard'
import { StatusTag } from '@/components/ui/StatusTag'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import {
  exporterEmployes,
  exporterPaie,
  televerserPhotoEmploye,
  modifierSalaireEmploye,
} from './employesApi'
import { useEmployePhotoUrl } from './useEmployePhoto'

// Lecture minimale de la candidature source (EF-EMP-05/EF-REC-13) — appel direct à l'endpoint
// public de recrutement plutôt qu'un import depuis `features/recruitment` (les deux features
// restent découplées, seule l'API REST partagée les relie).
interface CandidaturePourPrefill {
  nom?: string | null
  prenom?: string | null
  email?: string | null
  telephone?: string | null
  intitulePosteDetecte?: string | null
  cvFichierId?: string | null
}

function useCandidaturePrefill(candidatureId: string | undefined) {
  return useQuery({
    queryKey: ['candidature-prefill', candidatureId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data?: CandidaturePourPrefill }>(
        `/api/candidatures/${candidatureId}`,
      )
      return data.data ?? null
    },
    enabled: !!candidatureId,
  })
}

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
  const [tri, setTri] = useState<Tri>({ champ: 'nom', direction: 'asc' })
  const [filtres, setFiltres] = useState<FiltresEmployes>({
    page: 0,
    size: 50,
    sort: 'nom,asc',
  })
  const [modaleCreationManuelle, setModaleCreationManuelle] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moisPaie, setMoisPaie] = useState(() => format(new Date(), 'yyyy-MM'))
  const [exportPaieOuvert, setExportPaieOuvert] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const queryClient = useQueryClient()
  const { data: page, isLoading } = useEmployes(filtres)
  const creerMutation = useCreerEmploye()
  const employes = page?.content ?? []
  const total = page?.totalElements ?? 0

  // EF-EMP-05/EF-REC-13 : ouverture depuis une candidature "Embauchée" — préremplit le formulaire,
  // ne crée jamais la fiche automatiquement (décision verrouillée, cf. plan T3.B1). Dérivé
  // directement de l'URL plutôt que synchronisé via un effet (évite les rendus en cascade).
  const depuisCandidatureId = searchParams.get('depuisCandidatureId') ?? undefined
  // Défense en profondeur : EmployeController#creer() reste hasRole('ADMIN') strict, jamais
  // délégable (cf. CandidatDetailPage). Le lien qui pointe ici est déjà masqué pour un délégué,
  // mais l'URL ?depuisCandidatureId= reste tapable/partageable directement — ne jamais ouvrir la
  // modale de création pour un non-Admin même dans ce cas.
  const modaleCreation = estAdmin && (modaleCreationManuelle || !!depuisCandidatureId)
  const { data: candidaturePrefill } = useCandidaturePrefill(depuisCandidatureId)

  const prefill: EmployePrefill | null = candidaturePrefill
    ? {
        nom: candidaturePrefill.nom,
        prenom: candidaturePrefill.prenom,
        email: candidaturePrefill.email,
        telephone: candidaturePrefill.telephone,
        poste: candidaturePrefill.intitulePosteDetecte,
      }
    : null

  function fermerModaleCreation() {
    setModaleCreationManuelle(false)
    if (depuisCandidatureId) {
      searchParams.delete('depuisCandidatureId')
      setSearchParams(searchParams, { replace: true })
    }
  }

  function majFiltre(patch: Partial<FiltresEmployes>) {
    setFiltres((precedent) => ({ ...precedent, ...patch, page: 0 }))
  }

  function handleTri(champ: string) {
    const suivant = basculerTri(tri, champ)
    setTri(suivant)
    majFiltre({ sort: `${suivant.champ},${suivant.direction}` })
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
        dateEmbauche: format(valeurs.dateEmbauche, 'yyyy-MM-dd'),
        typeContrat: valeurs.typeContrat,
        dateFinContratPrevue: valeurs.dateFinContratPrevue
          ? format(valeurs.dateFinContratPrevue, 'yyyy-MM-dd')
          : undefined,
        dateFinStagePrevue: valeurs.dateFinStagePrevue
          ? format(valeurs.dateFinStagePrevue, 'yyyy-MM-dd')
          : undefined,
        candidatureOrigineId: depuisCandidatureId,
        cvFichierId: candidaturePrefill?.cvFichierId ?? undefined,
        sexe: valeurs.sexe || undefined,
        cin: valeurs.cin || undefined,
        sujetStage: valeurs.sujetStage || undefined,
        numeroCnss: valeurs.numeroCnss || undefined,
        numeroAmo: valeurs.numeroAmo || undefined,
        numeroCimr: valeurs.numeroCimr || undefined,
        rib: valeurs.rib || undefined,
        periodeEssaiFinLe: valeurs.periodeEssaiFinLe
          ? format(valeurs.periodeEssaiFinLe, 'yyyy-MM-dd')
          : undefined,
      })
      .then(async (employe) => {
        if (photo && employe.id) {
          await televerserPhotoEmploye(employe.id, photo)
        }
        if (valeurs.salaireBrutMensuel != null && employe.id) {
          await modifierSalaireEmploye(employe.id, valeurs.salaireBrutMensuel)
        }
        if ((photo || valeurs.salaireBrutMensuel != null) && employe.id) {
          await queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
        }
        void toast.success('Employé créé — carte badge générée.')
        fermerModaleCreation()
        setErreur(null)
      })
      .catch((err: ApiError) => setErreur(err.message))
  }

  async function lancerExport(fmt: 'xlsx' | 'pdf') {
    try {
      await exporterEmployes(
        {
          departementId: filtres.departementId,
          managerId: filtres.managerId,
          typeContrat: filtres.typeContrat,
          statut: filtres.statut,
          recherche: filtres.recherche,
        },
        fmt,
      )
    } catch {
      void toast.error("Échec de l'export")
    }
  }

  async function lancerExportPaie(fmt: 'xlsx' | 'pdf') {
    try {
      await exporterPaie(moisPaie, fmt)
    } catch {
      void toast.error("Échec de l'export paie")
    }
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
          prefill={prefill}
          departements={departements ?? []}
          managers={managers ?? []}
          onCancel={fermerModaleCreation}
          onSubmit={creerEmploye}
          submitting={creerMutation.isPending}
          errorMessage={erreur}
        />
      )}

      <PageHeader
        title="Employés"
        subtitle={`${total} employé${total !== 1 ? 's' : ''}`}
        actions={
          <>
            {estAdmin && (
              <button
                onClick={() => navigate('/import')}
                className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
              >
                <FileSpreadsheet size={13} /> Importer
              </button>
            )}
            {/* EF-EXP-01 : Export ouvert à Admin + Manager côté backend (EmployeController#exporter),
                donc jamais restreint au bloc Admin-only ci-dessous. DropdownMenu (pas un div
                "absolute" fait main) : ferme au clic extérieur/Échap, et surtout se ferme tout
                seul si l'autre menu export (Export paie) s'ouvre — deux triggers indépendants
                hand-roulés pouvaient rester ouverts ensemble et se chevaucher. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]">
                  <Download size={13} /> Exporter
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-36">
                {(['xlsx', 'pdf'] as const).map((fmt) => (
                  <DropdownMenuItem key={fmt} onSelect={() => void lancerExport(fmt)}>
                    {fmt === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {estAdmin && (
              // Popover, pas DropdownMenu : ce panneau contient un vrai contrôle de formulaire
              // (<input type="month">), pas une liste de commandes — DropdownMenu modélise un
              // role="menu" dont la navigation clavier/typeahead peut avaler les interactions avec
              // un input natif à l'intérieur (constaté : les boutons Excel/PDF ne déclenchaient
              // plus aucun appel réseau une fois placés dans un DropdownMenuItem). `open` contrôlé
              // explicitement plutôt que PopoverClose : fermeture déclenchée nous-mêmes après avoir
              // lancé l'export, aucune dépendance à la composition d'event handlers de Radix.
              <Popover open={exportPaieOuvert} onOpenChange={setExportPaieOuvert}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]">
                    <Download size={13} /> Export paie
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52">
                  <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Mois</label>
                  <input
                    type="month"
                    value={moisPaie}
                    onChange={(e) => setMoisPaie(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-[#D8D4CC] px-2 py-1.5 text-[12px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
                  />
                  <div className="flex gap-2">
                    {(['xlsx', 'pdf'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => {
                          setExportPaieOuvert(false)
                          void lancerExportPaie(fmt)
                        }}
                        className="flex-1 rounded-lg border border-[#D8D4CC] px-2 py-1.5 text-[12px] text-[#1B2A41] transition-colors hover:bg-[#F7F7F4]"
                      >
                        {fmt === 'xlsx' ? 'Excel' : 'PDF'}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {estAdmin && (
              <>
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
                  onClick={() => setModaleCreationManuelle(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#243650]"
                >
                  <Plus size={13} /> Ajouter un employé
                </button>
              </>
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={filtres.recherche ?? ''}
            onChange={(e) => majFiltre({ recherche: e.target.value || undefined })}
            placeholder="Rechercher par nom, prénom, e-mail, ID…"
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
                {selectionMode && <th className="w-8 py-3 pl-4" />}
                <SortableTh
                  label="ID"
                  champ="id"
                  tri={tri}
                  onChange={handleTri}
                  className="first:pl-5"
                />
                <SortableTh label="Employé" champ="nom" tri={tri} onChange={handleTri} />
                <SortableTh label="Poste" champ="poste" tri={tri} onChange={handleTri} />
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Département
                </th>
                <SortableTh label="Contrat" champ="typeContrat" tri={tri} onChange={handleTri} />
                <SortableTh label="Statut" champ="statut" tri={tri} onChange={handleTri} />
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase last:pr-5" />
              </tr>
            </thead>
            <tbody>
              {employes.map((emp: Employe) => (
                <tr
                  key={emp.id}
                  onClick={() =>
                    selectionMode ? toggleSelect(emp.id!) : navigate(`/employes/${emp.id}`)
                  }
                  className={`group cursor-pointer border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4] ${
                    selected.has(emp.id!) ? 'bg-[#1B2A41]/4' : ''
                  }`}
                >
                  {selectionMode && (
                    <td
                      className="py-3.5 pl-4"
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
                    className="py-3.5 pr-4 pl-5 text-[11px] text-[#9CA3AF]"
                    title={emp.id}
                  >
                    {emp.id ? emp.id.substring(0, 8) : '—'}
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
                  <td className="py-3.5 pr-5 text-right">
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
