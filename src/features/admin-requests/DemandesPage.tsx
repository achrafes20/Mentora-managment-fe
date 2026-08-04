import { FormEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarDays, Check, Download, Plus, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { PageHeader } from '@/components/ui/StatCard'
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
  obtenirSolde,
  rejeterDemande,
  supprimerJourFerie,
  supprimerPeriodeBlocageConges,
  type DemandeAdministrativeRequete,
  type GranulariteConge,
  type StatutDemandeAdministrative,
  type TypeDemandeAdministrative,
} from './adminRequestsApi'

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
  { value: 'document_libre', label: 'Document libre' },
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

  const demandesQuery = useQuery({
    queryKey: ['demandes-administratives', typeFiltre, statutFiltre, debutParam, finParam],
    queryFn: () =>
      listerDemandes({
        type: typeFiltre,
        statut: statutFiltre,
        debut: debutParam,
        fin: finParam,
        page: 0,
        size: 50,
      }),
  })

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

  function soumettreDemande(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    mutationDemande.mutate({
      ...form,
      dateFin: form.typeDemande === 'conge' ? (form.dateFin ?? form.dateDebut) : form.dateDebut,
      granularite: form.typeDemande === 'conge' ? form.granularite : undefined,
      heureDepart: form.typeDemande === 'bon_sortie' ? form.heureDepart : undefined,
      heureRetourPrevue: form.typeDemande === 'bon_sortie' ? form.heureRetourPrevue : undefined,
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
                  {['Employé', 'Type', 'Période / détail', 'Durée', 'Statut', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(demandesQuery.data?.content ?? []).map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-medium text-[#1B2A41]">
                      {d.employeNomComplet}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                      {TYPES.find((t) => t.value === d.typeDemande)?.label ?? d.typeDemande}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {d.dateDebut}
                      {d.dateFin && d.dateFin !== d.dateDebut ? ` → ${d.dateFin}` : ''}
                      {d.heureDepart ? ` · ${d.heureDepart}-${d.heureRetourPrevue}` : ''}
                      {d.motif ? <div className="text-[#9CA3AF]">{d.motif}</div> : null}
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

            <label className="block">
              <span className="text-[12px] font-medium text-[#1B2A41]">Motif / détail</span>
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
        <section className="space-y-4">
          <Select
            label="Employé"
            value={employeRegistreId}
            onChange={setEmployeRegistreId}
            options={[
              { value: '', label: 'Sélectionner' },
              ...employes
                .filter((e) => e.id)
                .map((e) => ({ value: e.id as string, label: nomEmploye(e) })),
            ]}
          />
          {soldeActuel && employeRegistreId && (
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Acquis" value={`${formatNombre(soldeActuel.acquisJours)} j`} />
              <Metric label="Mouvements" value={`${formatNombre(soldeActuel.mouvementsJours)} j`} />
              <Metric label="Solde" value={`${formatNombre(soldeActuel.soldeJours)} j`} />
            </div>
          )}
          <div className="space-y-3">
            {(mouvementsQuery.data ?? []).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[#D8D4CC] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-[12px] text-[#1B2A41]">{m.commentaire ?? m.typeMouvement}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{m.creeLe?.slice(0, 10)}</p>
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
          <p className="border-t border-[#D8D4CC] px-4 py-3 text-[11px] text-[#6B7280]">
            Remplace le taux fixe précédemment codé en dur — le solde de chaque employé est
            recalculé à la volée, aucune donnée déjà enregistrée n'est modifiée rétroactivement.
          </p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#D8D4CC] bg-white p-4">
      <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">{label}</p>
      <p
        style={{ fontFamily: 'var(--font-display)' }}
        className="mt-1 text-[28px] font-semibold text-[#1B2A41]"
      >
        {value}
      </p>
    </div>
  )
}
