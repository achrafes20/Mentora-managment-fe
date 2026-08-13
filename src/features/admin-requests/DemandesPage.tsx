import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarDays, Check, Download, Paperclip, Plus, Search, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog } from '@/components/ui/Dialog'
import { PageHeader } from '@/components/ui/StatCard'
import { basculerTri, SortableTh, type Tri } from '@/components/ui/SortableTh'
import { StatusTag } from '@/components/ui/StatusTag'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/lib/AuthContext'
import type { ApiError } from '@/lib/apiClient'
import { useEstDelegueActifMaintenant } from '../delegation/useDelegation'
import { listerEmployes } from '../employee/employesApi'
import {
  annulerDemande,
  approuverDemande,
  creerDemande,
  creerJourFerie,
  creerPeriodeBlocageConges,
  exporterDemandes,
  listerDemandes,
  listerJoursFeries,
  listerMouvements,
  listerPeriodesBlocageConges,
  listerPolitiqueConges,
  modifierPolitiqueConge,
  obtenirDemande,
  obtenirSolde,
  voirJustificatif,
  rejeterDemande,
  supprimerJourFerie,
  supprimerPeriodeBlocageConges,
  televerserJustificatif,
  type DemandeAdministrativeRequete,
  type GranulariteConge,
  type MouvementConge,
  type StatutDemandeAdministrative,
  type TypeDemandeAdministrative,
} from './adminRequestsApi'

// Le commentaire des mouvements consommation/recredit est un texte technique généré par le backend
// (autrefois "Consommation demande <uuid>", jamais destiné à être lu tel quel) — un libellé FR fixe
// est plus lisible. initialisation/ajustement peuvent porter un vrai commentaire humain (import
// Excel, saisie manuelle) : celui-ci reste affiché en priorité s'il est présent.
const LABELS_MOUVEMENT: Record<MouvementConge['typeMouvement'], string> = {
  initialisation: 'Solde initial',
  consommation: 'Consommation',
  recredit: 'Recrédit (annulation)',
  ajustement: 'Ajustement manuel',
}

function libelleMouvement(m: MouvementConge): string {
  if (m.typeMouvement === 'consommation' || m.typeMouvement === 'recredit') {
    return LABELS_MOUVEMENT[m.typeMouvement]
  }
  return m.commentaire || LABELS_MOUVEMENT[m.typeMouvement]
}

// Typeahead local (pas le Select générique du fichier — celui-ci filtre une liste déjà chargée
// côté client, pas de recherche serveur nécessaire pour un effectif de cette taille).
function EmployeSearch({
  employes,
  value,
  onChange,
}: {
  employes: { id?: string; nom?: string; prenom?: string; email?: string }[]
  value: string
  onChange: (id: string) => void
}) {
  const selectionne = employes.find((e) => e.id === value)
  const [query, setQuery] = useState('')
  const [ouvert, setOuvert] = useState(false)

  const resultats = employes
    .filter((e) => e.id)
    .filter((e) => nomEmploye(e).toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="relative min-w-64">
      <span className="text-[12px] font-medium text-[#1B2A41]">Employé</span>
      <div className="relative mt-1.5">
        <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={ouvert ? query : selectionne ? nomEmploye(selectionne) : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOuvert(true)
            if (value) onChange('')
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          placeholder="Rechercher un employé…"
          className="h-9 w-full rounded-lg border border-[#D8D4CC] bg-white pr-3 pl-8 text-[13px] text-[#1B2A41] outline-none focus:border-[#1B2A41]"
        />
      </div>
      {ouvert && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
          {resultats.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-[#9CA3AF]">Aucun résultat</p>
          )}
          {resultats.map((e) => (
            <button
              key={e.id}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onChange(e.id as string)
                setQuery('')
                setOuvert(false)
              }}
              className="block w-full px-3 py-2 text-left text-[13px] text-[#1B2A41] hover:bg-[#F7F7F4]"
            >
              {nomEmploye(e)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DemandeDetailDialog({
  demandeId,
  onClose,
}: {
  demandeId: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['demande-detail', demandeId],
    queryFn: () => obtenirDemande(demandeId as string),
    enabled: !!demandeId,
  })

  return (
    <Dialog open={!!demandeId} onOpenChange={(o) => !o && onClose()} title="Détail de la demande">
      {isLoading && <p className="text-[13px] text-[#6B7280]">Chargement…</p>}
      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#6B7280]">Type</span>
            <span className="text-[13px] text-[#1B2A41]">
              {TYPES.find((t) => t.value === data.typeDemande)?.label ?? data.typeDemande}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#6B7280]">Statut</span>
            <StatusTag statut={data.statut} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#6B7280]">Période</span>
            <span className="text-[13px] text-[#1B2A41]">
              {data.dateDebut}
              {data.dateFin && data.dateFin !== data.dateDebut ? ` → ${data.dateFin}` : ''}
            </span>
          </div>
          {data.dureeJours ? (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B7280]">Durée</span>
              <span className="text-[13px] text-[#1B2A41]">{formatNombre(data.dureeJours)} j</span>
            </div>
          ) : null}
          {data.motif && (
            <div>
              <span className="text-[12px] text-[#6B7280]">Motif</span>
              <p className="mt-0.5 text-[13px] text-[#1B2A41]">{data.motif}</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

function dateVersParam(date: Date | null): string | undefined {
  return date ? format(date, 'yyyy-MM-dd') : undefined
}

type Tab = 'liste' | 'nouvelle' | 'registre' | 'feries' | 'blocage' | 'politique'

const TABS_VALIDES: Tab[] = ['liste', 'nouvelle', 'registre', 'feries', 'blocage', 'politique']

const LABELS_TYPE_CONTRAT: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGIAIRE: 'Stagiaire',
  STAGIAIRE_REMUNERE: 'Stagiaire rémunéré',
}

const TYPES: { value: TypeDemandeAdministrative; label: string }[] = [
  { value: 'conge', label: 'Congé' },
  { value: 'bon_sortie', label: 'Bon de sortie' },
  { value: 'conge_mariage', label: 'Congé mariage' },
  { value: 'conge_naissance', label: 'Congé naissance' },
  { value: 'conge_deces', label: 'Congé décès' },
  { value: 'conge_maladie', label: 'Congé maladie' },
]

// EF-ADM-14 : congés légaux — période valide requise, pas de solde/quota (cf. TYPES ci-dessus).
const TYPES_CONGE_SPECIAL: TypeDemandeAdministrative[] = [
  'conge_mariage',
  'conge_naissance',
  'conge_deces',
  'conge_maladie',
]

const STATUTS: { value: StatutDemandeAdministrative; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuvee', label: 'Approuvée' },
  { value: 'rejetee', label: 'Rejetée' },
  { value: 'annulee', label: 'Annulée' },
]

function dateJour() {
  return new Date().toISOString().slice(0, 10)
}

function nomEmploye(e: { nom?: string; prenom?: string; email?: string }) {
  return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || e.email || 'Employé'
}

function formatNombre(valeur?: number) {
  return Number(valeur ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

export function DemandesPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const estDelegueActif = useEstDelegueActifMaintenant()
  // EF-AUTH-11/12 : un délégué actif peut approuver/rejeter/annuler comme l'Admin — jours fériés
  // (plus bas) restent strictement Admin, jamais délégables (miroir de verifierAdminOuDelegue()
  // côté backend, qui ne couvre que ces trois actions).
  const peutDecider = role === 'admin' || estDelegueActif
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    TABS_VALIDES.includes(tabParam as Tab) ? (tabParam as Tab) : 'liste',
  )
  const [typeFiltre, setTypeFiltre] = useState<TypeDemandeAdministrative | ''>('')
  const [statutFiltre, setStatutFiltre] = useState<StatutDemandeAdministrative | ''>('en_attente')
  const [debutFiltre, setDebutFiltre] = useState<Date | null>(null)
  const [finFiltre, setFinFiltre] = useState<Date | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [employeRegistreId, setEmployeRegistreId] = useState('')
  const [demandeDetailId, setDemandeDetailId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [form, setForm] = useState<DemandeAdministrativeRequete>({
    employeId: '',
    typeDemande: 'conge',
    granularite: 'journee',
    dateDebut: dateJour(),
    dateFin: dateJour(),
    motif: '',
  })
  const [justificatif, setJustificatif] = useState<File | null>(null)
  const [ferie, setFerie] = useState({ dateFerie: dateJour(), libelle: '' })
  const [blocage, setBlocage] = useState({
    dateDebut: dateJour(),
    dateFin: dateJour(),
    libelle: '',
  })

  const employesQuery = useQuery({
    queryKey: ['employes', 'admin-requests'],
    queryFn: () => listerEmployes({ size: 1000, statut: 'actif' }),
  })

  const employes = employesQuery.data?.content ?? []
  const employeSoldeId = form.employeId || employeRegistreId

  const debutParam = dateVersParam(debutFiltre)
  const finParam = dateVersParam(finFiltre)
  const [triDemandes, setTriDemandes] = useState<Tri>({ champ: 'dateDebut', direction: 'desc' })

  const demandesQuery = useQuery({
    queryKey: [
      'demandes-administratives',
      typeFiltre,
      statutFiltre,
      debutParam,
      finParam,
      triDemandes,
    ],
    queryFn: () =>
      listerDemandes({
        type: typeFiltre,
        statut: statutFiltre,
        debut: debutParam,
        fin: finParam,
        page: 0,
        size: 50,
        sort: `${triDemandes.champ},${triDemandes.direction}`,
      }),
  })

  function handleTriDemandes(champ: string) {
    setTriDemandes((t) => basculerTri(t, champ))
  }

  async function lancerExportDemandes(fmt: 'xlsx' | 'pdf') {
    setShowExport(false)
    try {
      await exporterDemandes(
        { type: typeFiltre, statut: statutFiltre, debut: debutParam, fin: finParam },
        fmt,
      )
    } catch {
      void toast.error("Échec de l'export")
    }
  }

  const soldeQuery = useQuery({
    queryKey: ['solde-conge', employeSoldeId],
    queryFn: () => obtenirSolde(employeSoldeId),
    enabled: Boolean(employeSoldeId),
  })

  const mouvementsQuery = useQuery({
    queryKey: ['mouvements-conges', employeRegistreId],
    queryFn: () => listerMouvements(employeRegistreId),
    enabled: Boolean(employeRegistreId),
  })

  const joursFeriesQuery = useQuery({
    queryKey: ['jours-feries'],
    queryFn: listerJoursFeries,
  })

  const periodesBlocageQuery = useQuery({
    queryKey: ['periodes-blocage-conges'],
    queryFn: listerPeriodesBlocageConges,
  })

  const politiqueCongesQuery = useQuery({
    queryKey: ['politique-conges'],
    queryFn: listerPolitiqueConges,
  })

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['demandes-administratives'] })
    await queryClient.invalidateQueries({ queryKey: ['solde-conge'] })
    await queryClient.invalidateQueries({ queryKey: ['mouvements-conges'] })
    await queryClient.invalidateQueries({ queryKey: ['jours-feries'] })
    await queryClient.invalidateQueries({ queryKey: ['periodes-blocage-conges'] })
    await queryClient.invalidateQueries({ queryKey: ['politique-conges'] })
  }

  const mutationDemande = useMutation({
    mutationFn: creerDemande,
    onSuccess: async () => {
      setMessage('Demande enregistrée.')
      setErreur(null)
      setJustificatif(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const decisionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string
      action: 'approuver' | 'rejeter' | 'annuler'
    }) => {
      if (action === 'approuver') return approuverDemande(id)
      if (action === 'rejeter') return rejeterDemande(id)
      return annulerDemande(id)
    },
    onSuccess: async () => {
      setMessage('Décision enregistrée.')
      setErreur(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const ferieMutation = useMutation({
    mutationFn: creerJourFerie,
    onSuccess: async () => {
      setFerie({ dateFerie: dateJour(), libelle: '' })
      setMessage('Jour férié enregistré.')
      setErreur(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const supprimerFerieMutation = useMutation({
    mutationFn: supprimerJourFerie,
    onSuccess: invalider,
    onError: (e: ApiError) => setErreur(e.message),
  })

  const blocageMutation = useMutation({
    mutationFn: creerPeriodeBlocageConges,
    onSuccess: async () => {
      setBlocage({ dateDebut: dateJour(), dateFin: dateJour(), libelle: '' })
      setMessage('Période de blocage enregistrée.')
      setErreur(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const supprimerBlocageMutation = useMutation({
    mutationFn: supprimerPeriodeBlocageConges,
    onSuccess: invalider,
    onError: (e: ApiError) => setErreur(e.message),
  })

  const politiqueMutation = useMutation({
    mutationFn: ({ typeContrat, joursParMois }: { typeContrat: string; joursParMois: number }) =>
      modifierPolitiqueConge(typeContrat, joursParMois),
    onSuccess: async () => {
      setMessage('Politique de congés mise à jour.')
      setErreur(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'liste', label: 'Demandes / approbation' },
    { key: 'nouvelle', label: 'Nouvelle demande' },
    { key: 'registre', label: 'Registre congés' },
    { key: 'feries', label: 'Jours fériés' },
    { key: 'blocage', label: 'Blocage congés' },
    { key: 'politique', label: 'Politique de congés' },
  ]

  const soldeActuel = soldeQuery.data
  const employeSelectionne = useMemo(
    () => employes.find((e) => e.id === form.employeId),
    [employes, form.employeId],
  )

  function majForm(champ: keyof DemandeAdministrativeRequete, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur || undefined }))
  }

  async function soumettreDemande(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setErreur(null)

    let fichierJustificatifId = form.fichierJustificatifId
    if (form.typeDemande === 'conge_maladie') {
      if (!justificatif && !fichierJustificatifId && !form.motif?.trim()) {
        setErreur('Un justificatif ou un motif est requis pour un congé maladie.')
        return
      }
      if (justificatif) {
        try {
          fichierJustificatifId = await televerserJustificatif(justificatif)
        } catch {
          setErreur('Échec du téléversement du justificatif.')
          return
        }
      }
    }

    const congeSpecial = TYPES_CONGE_SPECIAL.includes(form.typeDemande)
    mutationDemande.mutate({
      ...form,
      dateFin:
        form.typeDemande === 'conge' || congeSpecial
          ? (form.dateFin ?? form.dateDebut)
          : form.dateDebut,
      granularite: form.typeDemande === 'conge' ? form.granularite : undefined,
      heureDepart: form.typeDemande === 'bon_sortie' ? form.heureDepart : undefined,
      heureRetourPrevue: form.typeDemande === 'bon_sortie' ? form.heureRetourPrevue : undefined,
      fichierJustificatifId:
        form.typeDemande === 'conge_maladie' ? fichierJustificatifId : undefined,
    })
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Demandes administratives"
        subtitle="Congés, bons de sortie, documents libres, solde et jours fériés."
        actions={
          <button
            onClick={() => setTab('nouvelle')}
            className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] font-medium text-white"
          >
            <Plus size={13} /> Nouvelle demande
          </button>
        }
      />

      <div className="mb-5 flex gap-1 border-b border-[#D8D4CC]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#C92B6A] text-[#1B2A41]'
                : 'text-[#6B7280] hover:text-[#1B2A41]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(message || erreur) && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-[12px] ${
            erreur
              ? 'border-[#C1495A]/30 bg-[#C1495A]/5 text-[#C1495A]'
              : 'border-[#4A7C6B]/30 bg-[#4A7C6B]/5 text-[#4A7C6B]'
          }`}
        >
          {erreur ?? message}
        </div>
      )}

      {tab === 'liste' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
            <Select
              label="Type"
              value={typeFiltre}
              onChange={(v) => setTypeFiltre(v as TypeDemandeAdministrative | '')}
              options={[{ value: '', label: 'Tous' }, ...TYPES]}
            />
            <Select
              label="Statut"
              value={statutFiltre}
              onChange={(v) => setStatutFiltre(v as StatutDemandeAdministrative | '')}
              options={[{ value: '', label: 'Tous' }, ...STATUTS]}
            />
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Du</label>
              <DatePicker value={debutFiltre} onChange={setDebutFiltre} />
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium text-[#6B7280]">Au</label>
              <DatePicker value={finFiltre} onChange={setFinFiltre} />
            </div>
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setShowExport((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
              >
                <Download size={13} /> Exporter
              </button>
              {showExport && (
                <div className="absolute top-full right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
                  {(['xlsx', 'pdf'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => void lancerExportDemandes(fmt)}
                      className="block w-full px-4 py-2.5 text-left text-[12px] text-[#1B2A41] transition-colors hover:bg-[#F7F7F4]"
                    >
                      {fmt === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                  <SortableTh
                    label="Employé"
                    champ="employeId"
                    tri={triDemandes}
                    onChange={handleTriDemandes}
                  />
                  <SortableTh
                    label="Type"
                    champ="typeDemande"
                    tri={triDemandes}
                    onChange={handleTriDemandes}
                  />
                  <SortableTh
                    label="Période / détail"
                    champ="dateDebut"
                    tri={triDemandes}
                    onChange={handleTriDemandes}
                  />
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Durée
                  </th>
                  <SortableTh
                    label="Statut"
                    champ="statut"
                    tri={triDemandes}
                    onChange={handleTriDemandes}
                  />
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(demandesQuery.data?.content ?? []).map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-medium">
                      <button
                        type="button"
                        onClick={() => navigate(`/employes/${d.employeId}`)}
                        className="text-[#1B2A41] hover:underline"
                      >
                        {d.employeNomComplet}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                      {TYPES.find((t) => t.value === d.typeDemande)?.label ?? d.typeDemande}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {d.dateDebut}
                      {d.dateFin && d.dateFin !== d.dateDebut ? ` → ${d.dateFin}` : ''}
                      {d.heureDepart ? ` · ${d.heureDepart}-${d.heureRetourPrevue}` : ''}
                      {d.motif ? <div className="text-[#9CA3AF]">{d.motif}</div> : null}
                      {d.fichierJustificatifId && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await voirJustificatif(d.id)
                            } catch (error) {
                              const apiError = error as ApiError
                              toast.error(
                                apiError.message ?? "Échec de l'ouverture du justificatif",
                              )
                            }
                          }}
                          className="mt-0.5 flex items-center gap-1 text-[#4A7C6B] hover:underline"
                        >
                          <Paperclip size={11} />
                          Voir le justificatif
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {d.dureeJours ? `${formatNombre(d.dureeJours)} j` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusTag statut={d.statut} />
                    </td>
                    <td className="px-4 py-3.5">
                      {peutDecider && d.statut === 'en_attente' && (
                        <div className="flex gap-2">
                          <ActionButton
                            label="Approuver"
                            icon={<Check size={12} />}
                            onClick={() =>
                              decisionMutation.mutate({ id: d.id, action: 'approuver' })
                            }
                          />
                          <ActionButton
                            label="Rejeter"
                            icon={<X size={12} />}
                            danger
                            onClick={() => decisionMutation.mutate({ id: d.id, action: 'rejeter' })}
                          />
                        </div>
                      )}
                      {peutDecider && d.statut === 'approuvee' && (
                        <ActionButton
                          label="Annuler"
                          danger
                          onClick={() => decisionMutation.mutate({ id: d.id, action: 'annuler' })}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {!demandesQuery.isLoading && (demandesQuery.data?.content ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                      Aucune demande pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'nouvelle' && (
        <form
          onSubmit={soumettreDemande}
          className="grid gap-5 rounded-xl border border-[#D8D4CC] bg-white p-6 md:grid-cols-[1fr_320px]"
        >
          <div className="space-y-4">
            <Select
              label="Employé"
              value={form.employeId}
              onChange={(v) => majForm('employeId', v)}
              options={[
                { value: '', label: 'Sélectionner' },
                ...employes
                  .filter((e) => e.id)
                  .map((e) => ({ value: e.id as string, label: nomEmploye(e) })),
              ]}
            />
            <Select
              label="Type de demande"
              value={form.typeDemande}
              onChange={(v) => majForm('typeDemande', v)}
              options={TYPES}
            />

            {form.typeDemande === 'conge' && (
              <div className="grid gap-4 md:grid-cols-3">
                <Select
                  label="Granularité"
                  value={form.granularite ?? 'journee'}
                  onChange={(v) => majForm('granularite', v as GranulariteConge)}
                  options={[
                    { value: 'journee', label: 'Journée' },
                    { value: 'demi_matin', label: 'Demi-journée matin' },
                    { value: 'demi_apres_midi', label: 'Demi-journée après-midi' },
                  ]}
                />
                <Input
                  label="Début"
                  type="date"
                  value={form.dateDebut ?? ''}
                  onChange={(v) => majForm('dateDebut', v)}
                />
                <Input
                  label="Fin"
                  type="date"
                  value={form.dateFin ?? ''}
                  onChange={(v) => majForm('dateFin', v)}
                />
              </div>
            )}

            {form.typeDemande === 'bon_sortie' && (
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Date"
                  type="date"
                  value={form.dateDebut ?? ''}
                  onChange={(v) => majForm('dateDebut', v)}
                />
                <Input
                  label="Heure départ"
                  type="time"
                  value={form.heureDepart ?? ''}
                  onChange={(v) => majForm('heureDepart', v)}
                />
                <Input
                  label="Retour prévu"
                  type="time"
                  value={form.heureRetourPrevue ?? ''}
                  onChange={(v) => majForm('heureRetourPrevue', v)}
                />
              </div>
            )}

            {TYPES_CONGE_SPECIAL.includes(form.typeDemande) && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Début"
                  type="date"
                  value={form.dateDebut ?? ''}
                  onChange={(v) => majForm('dateDebut', v)}
                />
                <Input
                  label="Fin"
                  type="date"
                  value={form.dateFin ?? ''}
                  onChange={(v) => majForm('dateFin', v)}
                />
              </div>
            )}

            {form.typeDemande === 'conge_maladie' && (
              <label className="block">
                <span className="text-[12px] font-medium text-[#1B2A41]">
                  Justificatif (arrêt de travail) — optionnel
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setJustificatif(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-[12px] text-[#6B7280]"
                />
                {form.fichierJustificatifId && (
                  <span className="mt-1 block text-[11px] text-[#4A7C6B]">
                    Justificatif téléversé.
                  </span>
                )}
                <span className="mt-1 block text-[11px] text-[#9CA3AF]">
                  Sans arrêt de travail (repos à domicile, prévenu par message) : laissez vide et
                  précisez le contexte dans le motif ci-dessous.
                </span>
              </label>
            )}

            <label className="block">
              <span className="text-[12px] font-medium text-[#1B2A41]">
                Motif / détail
                {form.typeDemande === 'conge_maladie' &&
                !justificatif &&
                !form.fichierJustificatifId
                  ? ' — requis en l’absence de justificatif'
                  : ''}
              </span>
              <textarea
                value={form.motif ?? ''}
                onChange={(e) => majForm('motif', e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
              />
            </label>

            <button
              disabled={!form.employeId || mutationDemande.isPending}
              className="rounded-lg bg-[#1B2A41] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-40"
            >
              Enregistrer la demande
            </button>
          </div>

          <aside className="rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/6 p-4">
            <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
              Solde congé
            </p>
            <p className="mt-2 text-[13px] text-[#1B2A41]">
              {employeSelectionne ? nomEmploye(employeSelectionne) : 'Sélectionnez un employé'}
            </p>
            <p
              style={{ fontFamily: 'var(--font-display)' }}
              className="mt-2 text-[36px] font-semibold text-[#4A7C6B]"
            >
              {soldeQuery.isLoading ? '...' : `${formatNombre(soldeActuel?.soldeJours)} j`}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Calculé depuis l’ancienneté et le ledger, jamais stocké.
            </p>
          </aside>
        </form>
      )}

      {tab === 'registre' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="max-w-sm min-w-64 flex-1">
              <EmployeSearch
                employes={employes}
                value={employeRegistreId}
                onChange={setEmployeRegistreId}
              />
            </div>
            {soldeActuel && employeRegistreId && (
              <div className="rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/6 px-5 py-3">
                <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
                  Solde
                </p>
                <p
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-[26px] font-semibold text-[#4A7C6B]"
                >
                  {formatNombre(soldeActuel.soldeJours)} j
                </p>
              </div>
            )}
          </div>

          {employeRegistreId && (
            <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
              {(mouvementsQuery.data ?? []).length === 0 && (
                <p className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">Aucun mouvement</p>
              )}
              {(mouvementsQuery.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b border-[#D8D4CC]/60 px-4 py-3 last:border-0"
                >
                  <div>
                    {m.demandeId ? (
                      <button
                        type="button"
                        onClick={() => setDemandeDetailId(m.demandeId as string)}
                        className="text-[13px] font-medium text-[#4A7C6B] hover:underline"
                      >
                        {libelleMouvement(m)}
                      </button>
                    ) : (
                      <p className="text-[13px] font-medium text-[#1B2A41]">
                        {libelleMouvement(m)}
                      </p>
                    )}
                    <p className="text-[11px] text-[#9CA3AF]">{m.creeLe?.slice(0, 10)}</p>
                  </div>
                  <p
                    style={{ fontFamily: 'var(--font-code)' }}
                    className={`text-[13px] font-medium ${
                      m.quantiteJours >= 0 ? 'text-[#4A7C6B]' : 'text-[#C1495A]'
                    }`}
                  >
                    {m.quantiteJours >= 0 ? '+' : ''}
                    {formatNombre(m.quantiteJours)} j
                  </p>
                </div>
              ))}
            </div>
          )}
          <DemandeDetailDialog
            demandeId={demandeDetailId}
            onClose={() => setDemandeDetailId(null)}
          />
        </section>
      )}

      {tab === 'feries' && (
        <section className="grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
            {(joursFeriesQuery.data ?? []).map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between border-b border-[#D8D4CC]/60 px-4 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className="text-[#4A7C6B]" />
                  <div>
                    <p className="text-[13px] font-medium text-[#1B2A41]">{j.libelle}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{j.dateFerie}</p>
                  </div>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => supprimerFerieMutation.mutate(j.id)}
                    className="text-[12px] text-[#C1495A]"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>

          {role === 'admin' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ferieMutation.mutate(ferie)
              }}
              className="space-y-4 rounded-xl border border-[#D8D4CC] bg-white p-5"
            >
              <Input
                label="Date"
                type="date"
                value={ferie.dateFerie}
                onChange={(v) => setFerie((f) => ({ ...f, dateFerie: v }))}
              />
              <Input
                label="Libellé"
                value={ferie.libelle}
                onChange={(v) => setFerie((f) => ({ ...f, libelle: v }))}
              />
              <button
                disabled={!ferie.dateFerie || !ferie.libelle || ferieMutation.isPending}
                className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                Ajouter / mettre à jour
              </button>
              <p className="text-[11px] text-[#6B7280]">
                Les fêtes hégiriennes se saisissent manuellement chaque année.
              </p>
            </form>
          )}
        </section>
      )}

      {tab === 'blocage' && (
        <section className="grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
            {(periodesBlocageQuery.data ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-[#D8D4CC]/60 px-4 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className="text-[#C1495A]" />
                  <div>
                    <p className="text-[13px] font-medium text-[#1B2A41]">{p.libelle}</p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {p.dateDebut} → {p.dateFin}
                    </p>
                  </div>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => supprimerBlocageMutation.mutate(p.id)}
                    className="text-[12px] text-[#C1495A]"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
            {!periodesBlocageQuery.isLoading && (periodesBlocageQuery.data ?? []).length === 0 && (
              <p className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                Aucune période de blocage.
              </p>
            )}
          </div>

          {role === 'admin' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                blocageMutation.mutate(blocage)
              }}
              className="space-y-4 rounded-xl border border-[#D8D4CC] bg-white p-5"
            >
              <Input
                label="Début"
                type="date"
                value={blocage.dateDebut}
                onChange={(v) => setBlocage((b) => ({ ...b, dateDebut: v }))}
              />
              <Input
                label="Fin"
                type="date"
                value={blocage.dateFin}
                onChange={(v) => setBlocage((b) => ({ ...b, dateFin: v }))}
              />
              <Input
                label="Libellé"
                value={blocage.libelle}
                onChange={(v) => setBlocage((b) => ({ ...b, libelle: v }))}
              />
              <button
                disabled={
                  !blocage.dateDebut ||
                  !blocage.dateFin ||
                  !blocage.libelle ||
                  blocageMutation.isPending
                }
                className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                Ajouter la période de blocage
              </button>
              <p className="text-[11px] text-[#6B7280]">
                Toute nouvelle demande de congé chevauchant cette période sera refusée.
              </p>
            </form>
          )}
        </section>
      )}

      {tab === 'politique' && (
        <section className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Type de contrat', 'Jours acquis / mois', ''].map((h) => (
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
              {(politiqueCongesQuery.data ?? []).map((p) => (
                <PolitiqueCongeRow
                  key={`${p.typeContrat}-${p.modifieLe}`}
                  politique={p}
                  peutModifier={role === 'admin'}
                  enregistrement={politiqueMutation.isPending}
                  onEnregistrer={(joursParMois) =>
                    politiqueMutation.mutate({ typeContrat: p.typeContrat, joursParMois })
                  }
                />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function PolitiqueCongeRow({
  politique,
  peutModifier,
  enregistrement,
  onEnregistrer,
}: {
  politique: { typeContrat: string; joursParMois: number }
  peutModifier: boolean
  enregistrement: boolean
  onEnregistrer: (joursParMois: number) => void
}) {
  const [valeur, setValeur] = useState(String(politique.joursParMois))
  const modifie = Number(valeur) !== politique.joursParMois

  return (
    <tr className="border-b border-[#D8D4CC]/50 last:border-0">
      <td className="px-4 py-3 text-[13px] text-[#1B2A41]">
        {LABELS_TYPE_CONTRAT[politique.typeContrat] ?? politique.typeContrat}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.5"
          min="0"
          disabled={!peutModifier}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="w-24 rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-1.5 text-[13px] disabled:opacity-60"
        />
      </td>
      <td className="px-4 py-3">
        {peutModifier && modifie && (
          <button
            disabled={enregistrement || valeur === ''}
            onClick={() => onEnregistrer(Number(valeur))}
            className="text-[12px] text-[#4A7C6B] hover:underline disabled:opacity-40"
          >
            Enregistrer
          </button>
        )}
      </td>
    </tr>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-52">
      <span className="text-[12px] font-medium text-[#1B2A41]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[#1B2A41]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      />
    </label>
  )
}

function ActionButton({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
        danger ? 'bg-[#C1495A]/10 text-[#C1495A]' : 'bg-[#4A7C6B]/10 text-[#4A7C6B]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
