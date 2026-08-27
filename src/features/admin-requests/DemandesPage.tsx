import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarDays, Check, Download, ExternalLink, Paperclip, Send, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog } from '@/components/ui/Dialog'
import { PageHeader } from '@/components/ui/StatCard'
import { basculerTri, SortableTh, type Tri } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { PersonSearch } from '@/components/ui/PersonSearch'
import { StatusTag } from '@/components/ui/StatusTag'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/lib/AuthContext'
import type { ApiError } from '@/lib/apiClient'
import { useEstDelegueActifMaintenant } from '../delegation/useDelegation'
import { listerEmployes, type Employe } from '../employee/employesApi'
import {
  useApercuAttestationTravail,
  useApercuAttestationSalaire,
  useEnvoyerAttestationTravail,
  useEnvoyerAttestationSalaire,
  useEnvoyerDocumentLibre,
} from '../documents/useDocuments'
import {
  annulerDemande,
  approuverDemande,
  creerDemande,
  creerPeriodeBlocageConges,
  exporterDemandes,
  exporterRegistre,
  listerDemandes,
  listerMouvements,
  listerPeriodesBlocageConges,
  listerPolitiqueConges,
  modifierPolitiqueConge,
  obtenirDemande,
  obtenirSolde,
  voirJustificatif,
  rejeterDemande,
  supprimerPeriodeBlocageConges,
  televerserJustificatif,
  type DemandeAdministrative,
  type DemandeAdministrativeRequete,
  type GranulariteConge,
  type StatutDemandeAdministrative,
  type TypeDemandeAdministrative,
} from './adminRequestsApi'

// EF-ADM-15 : traite une "demande_document" en réglant réellement la demande, plutôt qu'un simple
// changement de statut — équivalent à "Envoyer un document libre" côté Documents RH, mais avec en
// plus les documents déjà générables automatiquement pour cet employé (attestation de travail /
// de salaire) proposés en premier, prêts à envoyer sans ressaisie. La demande n'est marquée
// approuvée qu'une fois l'envoi effectivement confirmé (cf. onEnvoye côté appelant).
function EnvoyerDocumentModal({
  demande,
  employe,
  onClose,
  onEnvoye,
}: {
  demande: DemandeAdministrative | null
  employe: Employe | undefined
  onClose: () => void
  onEnvoye: () => Promise<void>
}) {
  const [fichierLibre, setFichierLibre] = useState<File | null>(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const envoyerAttestationTravail = useEnvoyerAttestationTravail()
  const envoyerAttestationSalaire = useEnvoyerAttestationSalaire()
  const envoyerDocumentLibre = useEnvoyerDocumentLibre()
  const apercuAttestationTravail = useApercuAttestationTravail()
  const apercuAttestationSalaire = useApercuAttestationSalaire()

  async function envoyer(action: () => Promise<unknown>) {
    setEnvoiEnCours(true)
    try {
      await action()
      toast.success(
        demande?.statut === 'en_attente'
          ? 'Document envoyé à l’employé — demande marquée approuvée.'
          : 'Document renvoyé à l’employé.',
      )
      setFichierLibre(null)
      await onEnvoye()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message ?? "Échec de l'envoi du document")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  // Ouvre le PDF dans un nouvel onglet, sans envoi ni entrée dans l'historique — même génération
  // que l'envoi réel (DocumentRhService), juste pour vérifier le contenu avant de le transmettre.
  async function apercevoir(action: () => Promise<unknown>) {
    try {
      await action()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message ?? "Erreur lors de l'aperçu du document")
    }
  }

  // Même éligibilité que côté backend (DocumentRhService#validerEligibiliteAttestation) : employé
  // actif, CDI ou CDD. Affiché même indisponible (plutôt que masqué) pour que l'Admin comprenne
  // pourquoi l'option est grisée au lieu de la croire simplement absente.
  const eligibleAttestationTravail =
    employe?.statut === 'actif' &&
    (employe?.typeContrat === 'CDI' || employe?.typeContrat === 'CDD')
  const eligibleAttestationSalaire =
    eligibleAttestationTravail && employe?.salaireBrutMensuel != null

  return (
    <Dialog
      open={!!demande}
      onOpenChange={(o) => !o && onClose()}
      title={demande?.statut === 'en_attente' ? 'Envoyer un document' : 'Renvoyer un document'}
      width={480}
    >
      {demande && (
        <div>
          <p className="mb-4 text-[12px] text-[#6B7280]">
            Demande de{' '}
            <span className="font-medium text-[#1B2A41]">{demande.employeNomComplet}</span>
            {demande.motif ? <> — « {demande.motif} »</> : null}
          </p>

          <p className="mb-2 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
            Documents prêts à envoyer
          </p>
          <div className="mb-4 space-y-2">
            <DocumentOption
              label="Attestation de travail"
              disabled={!eligibleAttestationTravail || envoiEnCours}
              apercuEnCours={apercuAttestationTravail.isPending}
              hint={
                !eligibleAttestationTravail ? 'Nécessite un employé actif en CDI ou CDD' : undefined
              }
              onApercu={() =>
                apercevoir(() => apercuAttestationTravail.mutateAsync(demande.employeId))
              }
              onEnvoyer={() =>
                envoyer(() => envoyerAttestationTravail.mutateAsync(demande.employeId))
              }
            />
            <DocumentOption
              label="Attestation de salaire"
              disabled={!eligibleAttestationSalaire || envoiEnCours}
              apercuEnCours={apercuAttestationSalaire.isPending}
              hint={
                !eligibleAttestationSalaire && eligibleAttestationTravail
                  ? 'Salaire brut non renseigné sur la fiche'
                  : !eligibleAttestationTravail
                    ? 'Nécessite un employé actif en CDI ou CDD'
                    : undefined
              }
              onApercu={() =>
                apercevoir(() => apercuAttestationSalaire.mutateAsync(demande.employeId))
              }
              onEnvoyer={() =>
                envoyer(() => envoyerAttestationSalaire.mutateAsync(demande.employeId))
              }
            />
          </div>

          <p className="mb-2 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
            Ou un autre document
          </p>
          <label className="inline-block cursor-pointer rounded-lg border border-dashed border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
            Choisir un fichier
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFichierLibre(e.target.files?.[0] ?? null)}
            />
          </label>
          {fichierLibre && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[12px] text-[#6B7280]">{fichierLibre.name}</span>
              <button
                disabled={envoiEnCours}
                onClick={() =>
                  envoyer(() =>
                    envoyerDocumentLibre.mutateAsync({
                      employeId: demande.employeId,
                      fichier: fichierLibre,
                    }),
                  )
                }
                className="rounded-md bg-[#1B2A41] px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
              >
                Envoyer ce fichier
              </button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

function DocumentOption({
  label,
  hint,
  disabled,
  apercuEnCours,
  onApercu,
  onEnvoyer,
}: {
  label: string
  hint?: string
  disabled?: boolean
  apercuEnCours?: boolean
  onApercu: () => void
  onEnvoyer: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#D8D4CC] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#1B2A41]">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{hint}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={disabled || apercuEnCours}
          onClick={onApercu}
          className="flex items-center gap-1 rounded-md border border-[#D8D4CC] px-2.5 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLink size={11} /> Aperçu
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onEnvoyer}
          className="flex items-center gap-1 rounded-md bg-[#1B2A41] px-2.5 py-1.5 text-[11px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={11} /> Envoyer
        </button>
      </div>
    </div>
  )
}

function dateVersParam(date: Date | null): string | undefined {
  return date ? format(date, 'yyyy-MM-dd') : undefined
}

type Tab = 'liste' | 'nouvelle' | 'registre' | 'blocage' | 'politique'

const TABS_VALIDES: Tab[] = ['liste', 'nouvelle', 'registre', 'blocage', 'politique']

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
  { value: 'demande_document', label: 'Demande de document' },
  { value: 'autre', label: 'Autre' },
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
  // "Demandes / approbation" reste accessible à un délégué actif (il doit voir ce qu'il approuve),
  // mais Blocage congés / Politique de congés restent strictement Admin — même périmètre que
  // peutDecider vs. les écrans non délégables (cf. commentaire ci-dessus). Jours fériés a sa propre
  // page (JoursFeriesPage), accessible uniquement depuis Configuration, comme le Journal d'audit.
  const tabsVisibles: Tab[] = [
    ...(peutDecider ? (['liste'] as const) : []),
    'nouvelle',
    'registre',
    ...(role === 'admin' ? (['blocage', 'politique'] as const) : []),
  ]
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    TABS_VALIDES.includes(tabParam as Tab) && tabsVisibles.includes(tabParam as Tab)
      ? (tabParam as Tab)
      : tabsVisibles[0],
  )
  // Filet de sécurité si le statut de délégué expire en cours de session (estDelegueActif change
  // de façon asynchrone, cf. useEstDelegueActifMaintenant) : dérivé au rendu plutôt qu'un effet +
  // setState (pas de cascade de rendus), retombe sur le premier onglet encore visible.
  const tabEffectif = tabsVisibles.includes(tab) ? tab : tabsVisibles[0]
  const [typeFiltre, setTypeFiltre] = useState<TypeDemandeAdministrative | ''>('')
  const [statutFiltre, setStatutFiltre] = useState<StatutDemandeAdministrative | ''>('en_attente')
  const [debutFiltre, setDebutFiltre] = useState<Date | null>(null)
  const [finFiltre, setFinFiltre] = useState<Date | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showExportRegistre, setShowExportRegistre] = useState(false)
  // Lien direct depuis la fiche employé (EmployeDetailPage) vers son registre pré-filtré, ex.
  // /demandes?tab=registre&employeId=... — évite une recherche manuelle répétitive.
  const [employeRegistreId, setEmployeRegistreId] = useState(searchParams.get('employeId') ?? '')
  // demande_document en attente en cours de traitement via la modale "Envoyer un document" —
  // distinct du simple Approuver/Rejeter des autres types (cf. modale plus bas).
  const [demandeDocumentActive, setDemandeDocumentActive] = useState<DemandeAdministrative | null>(
    null,
  )
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

  async function lancerExportRegistre(fmt: 'xlsx' | 'pdf') {
    setShowExportRegistre(false)
    if (!employeRegistreId) return
    try {
      await exporterRegistre(employeRegistreId, fmt)
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
  const {
    trie: mouvementsTries,
    tri: triMouvements,
    handleTri: handleTriMouvements,
  } = useTriLocal(
    mouvementsQuery.data,
    (m, champ) => (champ === 'creeLe' ? m.creeLe : m.quantiteJours),
    { champ: 'creeLe', direction: 'desc' },
  )

  // Détail de la demande intégré directement dans le tableau du registre (plus de modale à part) :
  // un fetch par demande liée, en parallèle — le nombre de mouvements par employé reste faible,
  // pas besoin d'un endpoint de lecture groupée dédié pour ça.
  const demandeIdsRegistre = [
    ...new Set((mouvementsQuery.data ?? []).flatMap((m) => (m.demandeId ? [m.demandeId] : []))),
  ]
  const demandesRegistreQueries = useQueries({
    queries: demandeIdsRegistre.map((id) => ({
      queryKey: ['demande-detail', id],
      queryFn: () => obtenirDemande(id),
    })),
  })
  const demandesRegistreParId = new Map(
    demandeIdsRegistre.map((id, i) => [id, demandesRegistreQueries[i]?.data]),
  )

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

  const LIBELLES_TAB: Record<Tab, string> = {
    liste: 'Demandes / approbation',
    nouvelle: 'Nouvelle demande',
    registre: 'Registre congés',
    blocage: 'Blocage congés',
    politique: 'Politique de congés',
  }
  const tabs: { key: Tab; label: string }[] = tabsVisibles.map((key) => ({
    key,
    label: LIBELLES_TAB[key],
  }))

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

    // Le justificatif est optionnel pour tous les types de demande (upload générique, supporté
    // tel quel par le backend — DemandeAdministrative.fichierJustificatifId) ; seul conge_maladie
    // impose qu'au moins l'un des deux (justificatif ou motif) soit renseigné.
    let fichierJustificatifId = form.fichierJustificatifId
    if (
      form.typeDemande === 'conge_maladie' &&
      !justificatif &&
      !fichierJustificatifId &&
      !form.motif?.trim()
    ) {
      setErreur('Un justificatif ou un motif est requis pour un congé maladie.')
      return
    }
    // Même validation que le backend (case autre, demande_document -> motif obligatoire).
    if (
      (form.typeDemande === 'demande_document' || form.typeDemande === 'autre') &&
      !form.motif?.trim()
    ) {
      setErreur('Le motif est obligatoire pour ce type de demande.')
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
      fichierJustificatifId,
    })
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Demandes administratives"
        subtitle="Congés, bons de sortie, documents libres, solde et jours fériés."
      />

      <div className="mb-5 flex gap-1 border-b border-[#D8D4CC]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-medium transition-colors ${
              tabEffectif === t.key
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

      {tabEffectif === 'liste' && (
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
                          {d.typeDemande === 'demande_document' ? (
                            // Approuver seul ne règle pas la demande — l'Admin doit encore aller
                            // générer/envoyer le document depuis Documents RH. Cette action ouvre
                            // directement ce flux (mêmes documents auto-générés + document libre)
                            // et marque la demande approuvée une fois l'envoi confirmé.
                            <ActionButton
                              label="Envoyer un document"
                              icon={<Send size={12} />}
                              onClick={() => setDemandeDocumentActive(d)}
                            />
                          ) : (
                            <ActionButton
                              label="Approuver"
                              icon={<Check size={12} />}
                              onClick={() =>
                                decisionMutation.mutate({ id: d.id, action: 'approuver' })
                              }
                            />
                          )}
                          <ActionButton
                            label="Rejeter"
                            icon={<X size={12} />}
                            danger
                            onClick={() => decisionMutation.mutate({ id: d.id, action: 'rejeter' })}
                          />
                        </div>
                      )}
                      {peutDecider &&
                        d.statut === 'approuvee' &&
                        (d.typeDemande === 'demande_document' ? (
                          // Annuler n'a pas de sens ici (pas de solde à recréditer) — permet de
                          // renvoyer un document si le premier envoi s'est perdu ou qu'un autre
                          // document est finalement nécessaire, via la même modale de choix.
                          <ActionButton
                            label="Renvoyer un document"
                            icon={<Send size={12} />}
                            onClick={() => setDemandeDocumentActive(d)}
                          />
                        ) : !d.dateDebut || d.dateDebut > dateJour() ? (
                          <ActionButton
                            label="Annuler"
                            danger
                            onClick={() => decisionMutation.mutate({ id: d.id, action: 'annuler' })}
                          />
                        ) : (
                          // Miroir de la règle backend (AdministrativeService#annuler) : jour de
                          // départ atteint ou passé, plus annulable — l'employé peut déjà être
                          // absent, on ne peut plus faire comme si le congé n'avait jamais eu lieu.
                          <span
                            className="text-[11px] text-[#9CA3AF]"
                            title="Jour de départ atteint ou passé"
                          >
                            Non annulable
                          </span>
                        ))}
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
          <EnvoyerDocumentModal
            demande={demandeDocumentActive}
            employe={employes.find((e) => e.id === demandeDocumentActive?.employeId)}
            onClose={() => setDemandeDocumentActive(null)}
            onEnvoye={async () => {
              // Renvoyer un document sur une demande déjà approuvée ne doit pas re-déclencher
              // approuver() : le backend refuse d'approuver une demande qui n'est plus en_attente.
              if (demandeDocumentActive && demandeDocumentActive.statut === 'en_attente') {
                await decisionMutation.mutateAsync({
                  id: demandeDocumentActive.id,
                  action: 'approuver',
                })
              }
              setDemandeDocumentActive(null)
            }}
          />
        </section>
      )}

      {tabEffectif === 'nouvelle' && (
        <form
          onSubmit={soumettreDemande}
          className="grid gap-5 rounded-xl border border-[#D8D4CC] bg-white p-6 md:grid-cols-[1fr_320px]"
        >
          <div className="space-y-4">
            <PersonSearch
              label="Employé"
              placeholder="Rechercher un employé…"
              personnes={employes}
              value={form.employeId}
              onChange={(v) => majForm('employeId', v)}
              required
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

            <label className="block">
              <span className="text-[12px] font-medium text-[#1B2A41]">
                Motif / détail
                {form.typeDemande === 'conge_maladie' &&
                !justificatif &&
                !form.fichierJustificatifId
                  ? ' — requis en l’absence de justificatif'
                  : ''}
                {form.typeDemande === 'demande_document' ? ' — requis (ex. document attendu)' : ''}
                {form.typeDemande === 'autre' ? ' — requis' : ''}
              </span>
              <textarea
                value={form.motif ?? ''}
                onChange={(e) => majForm('motif', e.target.value)}
                rows={4}
                placeholder={
                  form.typeDemande === 'demande_document'
                    ? 'Ex. : attestation de travail pour la banque'
                    : undefined
                }
                className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
              />
            </label>

            <div>
              <span className="text-[12px] font-medium text-[#1B2A41]">
                {form.typeDemande === 'conge_maladie'
                  ? 'Justificatif (arrêt de travail) — optionnel'
                  : 'Justificatif (optionnel)'}
              </span>
              <div className="mt-1.5 flex items-center gap-3">
                <label className="cursor-pointer rounded-lg border border-dashed border-[#D8D4CC] px-4 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
                  Choisir un fichier
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setJustificatif(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                {justificatif && (
                  <span className="text-[12px] text-[#6B7280]">{justificatif.name}</span>
                )}
              </div>
              {form.fichierJustificatifId && (
                <span className="mt-1 block text-[11px] text-[#4A7C6B]">
                  Justificatif téléversé.
                </span>
              )}
              {form.typeDemande === 'conge_maladie' && (
                <span className="mt-1 block text-[11px] text-[#9CA3AF]">
                  Sans arrêt de travail (repos à domicile, prévenu par message) : laissez vide et
                  précisez le contexte dans le motif ci-dessus.
                </span>
              )}
            </div>

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

      {tabEffectif === 'registre' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-[13px] font-semibold text-[#1B2A41]">Registre des congés</h2>
            <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
              Historique des mouvements de solde (acquisition, consommation, recrédit, ajustement)
              par employé.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#D8D4CC] bg-white p-4">
            <div className="max-w-sm min-w-64 flex-1">
              <PersonSearch
                placeholder="Rechercher un employé…"
                personnes={employes}
                value={employeRegistreId}
                onChange={setEmployeRegistreId}
              />
            </div>
            {employeRegistreId && (
              <div className="ml-auto flex items-center gap-3">
                {soldeActuel && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#4A7C6B]/20 bg-[#4A7C6B]/6 px-3 py-1.5">
                    <span className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">
                      Solde
                    </span>
                    <span
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-[16px] font-semibold text-[#4A7C6B]"
                    >
                      {formatNombre(soldeActuel.soldeJours)} j
                    </span>
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportRegistre((v) => !v)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 text-[12px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                  >
                    <Download size={13} /> Exporter
                  </button>
                  {showExportRegistre && (
                    <div className="absolute top-full right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
                      {(['xlsx', 'pdf'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => void lancerExportRegistre(fmt)}
                          className="block w-full px-4 py-2.5 text-left text-[12px] text-[#1B2A41] transition-colors hover:bg-[#F7F7F4]"
                        >
                          {fmt === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!employeRegistreId && (
            <div className="rounded-xl border border-dashed border-[#D8D4CC] bg-white p-10 text-center">
              <p className="text-[13px] text-[#9CA3AF]">
                Sélectionnez un employé ci-dessus pour consulter son registre de congés.
              </p>
            </div>
          )}

          {employeRegistreId && (
            <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                    <SortableTh
                      label="Date"
                      champ="creeLe"
                      tri={triMouvements}
                      onChange={handleTriMouvements}
                    />
                    <SortableTh
                      label="Quantité"
                      champ="quantiteJours"
                      tri={triMouvements}
                      onChange={handleTriMouvements}
                      className="text-right"
                    />
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                      Statut de la demande
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                      Période
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                      Motif
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mouvementsTries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-[13px] text-[#9CA3AF]">
                        Aucun mouvement pour cet employé.
                      </td>
                    </tr>
                  )}
                  {mouvementsTries.map((m) => {
                    const demande = m.demandeId ? demandesRegistreParId.get(m.demandeId) : undefined
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-[#D8D4CC]/60 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                      >
                        <td
                          style={{ fontFamily: 'var(--font-code)' }}
                          className="px-4 py-3 text-[12px] text-[#6B7280]"
                        >
                          {m.creeLe?.slice(0, 10)}
                        </td>
                        <td
                          style={{ fontFamily: 'var(--font-code)' }}
                          className={`px-4 py-3 text-right text-[13px] font-medium ${
                            m.quantiteJours >= 0 ? 'text-[#4A7C6B]' : 'text-[#C1495A]'
                          }`}
                        >
                          {m.quantiteJours >= 0 ? '+' : ''}
                          {formatNombre(m.quantiteJours)} j
                        </td>
                        <td className="px-4 py-3">
                          {demande ? (
                            <StatusTag statut={demande.statut} />
                          ) : (
                            <span className="text-[12px] text-[#D8D4CC]">—</span>
                          )}
                        </td>
                        <td
                          style={{ fontFamily: 'var(--font-code)' }}
                          className="px-4 py-3 text-[12px] text-[#6B7280]"
                        >
                          {demande
                            ? `${demande.dateDebut}${
                                demande.dateFin && demande.dateFin !== demande.dateDebut
                                  ? ` → ${demande.dateFin}`
                                  : ''
                              }`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#6B7280]">
                          {demande?.motif || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tabEffectif === 'blocage' && (
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

      {tabEffectif === 'politique' && (
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
