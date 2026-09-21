import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Ban, Download, Eye, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/Button'
import { StatusTag } from '@/components/ui/StatusTag'
import { PersonSearch } from '@/components/ui/PersonSearch'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTriLocal } from '@/components/ui/useTriLocal'
import { formatStatut } from '@/components/ui/tokens'
import { toast } from '@/components/ui/toast'
import { confirm } from '@/components/ui/confirm'
import type { ApiError } from '@/lib/apiClient'
import {
  desactiverSiteQr,
  genererCodeActivationPersonnel,
  genererSiteQr,
  listerActivationsKiosque,
  listerSitesQr,
  revoquerActivationKiosque,
  type KiosqueActivationReponse,
  type SiteQrCodeReponse,
} from './api'
import { apercuPosterSite, telechargerPosterSite } from './posterSite'
import { listerEmployes } from '../employee/employesApi'

const CLE_ACTIVATIONS_KIOSQUE = ['kiosque-activations'] as const

// NFR-UX-02 : le statut en base reste "en_attente" indéfiniment même après expiration (vérifiée
// seulement à la saisie côté backend, jamais réécrite en base) — dérivé ici à l'affichage plutôt
// que stocké, pour ne jamais diverger. Miroir du défaut backend (app.security.kiosque
// .expiration-code-heures) ; purement informatif, l'application réelle reste côté serveur.
const EXPIRATION_CODE_HEURES = 24

function estCodeExpire(a: { statut: string; emisLe: string }): boolean {
  return (
    a.statut === 'en_attente' &&
    dayjs(a.emisLe).add(EXPIRATION_CODE_HEURES, 'hour').isBefore(dayjs())
  )
}

/**
 * NFR-UX-02 : écran de gestion des activations kiosque — génération d'un code (affiché une seule
 * fois, jamais récupérable ensuite) et révocation. Réservé à l'Admin/délégué actif côté backend ;
 * le tab qui monte ce composant applique déjà la même garde (cf. PresencePage).
 */
export function KiosqueActivationsPanel() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [codeGenere, setCodeGenere] = useState<string | null>(null)
  const [nomEmployeCodeGenere, setNomEmployeCodeGenere] = useState<string | null>(null)

  const { data: activations, isLoading } = useQuery({
    queryKey: CLE_ACTIVATIONS_KIOSQUE,
    queryFn: listerActivationsKiosque,
  })

  const { data: employesPage } = useQuery({
    queryKey: ['employes', 'kiosque-personnel'],
    queryFn: () => listerEmployes({ size: 1000, statut: 'actif' }),
  })
  const employes = employesPage?.content ?? []

  function nomEmploye(a: KiosqueActivationReponse): string {
    if (!a.employeId) return 'Kiosque partagé'
    const e = employes.find((emp) => emp.id === a.employeId)
    return e ? `${e.prenom} ${e.nom}` : 'Personnel'
  }

  // "Expiré" est un statut dérivé à l'affichage (cf. estCodeExpire ci-dessus), jamais stocké tel
  // quel en base — le filtre doit donc le recalculer plutôt que comparer a.statut directement.
  function statutEffectif(a: KiosqueActivationReponse): string {
    return estCodeExpire(a) ? 'expire' : a.statut
  }

  const [filtreEmployeId, setFiltreEmployeId] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<
    '' | 'en_attente' | 'active' | 'expire' | 'revoquee'
  >('')

  const activationsUniques = Object.values(
    (activations ?? []).reduce(
      (acc, current) => {
        const cle = current.employeId || current.id
        if (!acc[cle] || dayjs(current.emisLe).isAfter(dayjs(acc[cle].emisLe))) {
          acc[cle] = current
        }
        return acc
      },
      {} as Record<string, KiosqueActivationReponse>,
    ),
  )

  const activationsFiltrees = activationsUniques.filter((a) => {
    if (filtreEmployeId && a.employeId !== filtreEmployeId) return false
    if (filtreStatut && statutEffectif(a) !== filtreStatut) return false
    return true
  })

  const {
    trie: activationsTriees,
    tri,
    handleTri,
  } = useTriLocal(
    activationsFiltrees,
    (a, champ) => {
      if (champ === 'employe') return nomEmploye(a)
      return a[champ as keyof KiosqueActivationReponse] as string | number | null | undefined
    },
    { champ: 'emisLe', direction: 'desc' },
  )

  // EF-ATT-17 : un seul site (siège Tétouan) — pas de saisie de libellé, "Régénérer" remplace le
  // QR actif plutôt que d'accumuler des sites différents.
  const LIBELLE_SIEGE = 'Siège Tétouan'
  const { data: sitesQr, isLoading: sitesQrLoading } = useQuery({
    queryKey: ['sites-qr'],
    queryFn: listerSitesQr,
  })
  const siteActif = (sitesQr ?? []).find((s) => s.actif) ?? null

  const genererSiteMutation = useMutation<SiteQrCodeReponse, ApiError, string>({
    mutationFn: genererSiteQr,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sites-qr'] })
      toast.success('QR de site généré.')
    },
    onError: (err) => toast.error(err.message),
  })

  const regenererSiteMutation = useMutation<void, ApiError, string>({
    mutationFn: async (idActuel: string) => {
      await desactiverSiteQr(idActuel)
      await genererSiteQr(LIBELLE_SIEGE)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sites-qr'] })
      toast.success('QR de site régénéré.')
    },
    onError: (err) => toast.error(err.message),
  })

  // EF-ATT-16 : code lié à un employé — l'appareil qui l'active devient son téléphone personnel.
  const genererPersonnelMutation = useMutation<{ id: string; code: string }, ApiError, string>({
    mutationFn: genererCodeActivationPersonnel,
    onSuccess: (res, employeId) => {
      setCodeGenere(res.code)
      const e = employes.find((emp) => emp.id === employeId)
      setNomEmployeCodeGenere(e ? `${e.prenom} ${e.nom}` : null)
      void queryClient.invalidateQueries({ queryKey: CLE_ACTIVATIONS_KIOSQUE })
    },
    onError: (err) => toast.error(err.message),
  })

  const revoquerMutation = useMutation<void, ApiError, string>({
    mutationFn: revoquerActivationKiosque,
    onSuccess: () => {
      toast.success('Activation révoquée.')
      void queryClient.invalidateQueries({ queryKey: CLE_ACTIVATIONS_KIOSQUE })
    },
    onError: (err) => toast.error(err.message),
  })

  function demanderRevocation(id: string) {
    confirm({
      title: 'Révoquer cette activation ?',
      content: "L'appareil concerné devra ressaisir un nouveau code pour scanner à nouveau.",
      okText: 'Révoquer',
      onOk: async () => {
        try {
          await revoquerMutation.mutateAsync(id)
        } catch {
          // déjà notifié par onError de la mutation
        }
      },
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold text-[#1B2A41]">Pointage mobile</h3>
        <p className="text-[12px] text-[#6B7280]">
          Chaque employé reçoit son code personnel par e-mail à la création de sa fiche ; il
          l'active une fois sur son téléphone puis pointe en scannant le QR de site.
        </p>
      </div>

      <div className="rounded-xl border border-[#D8D4CC] bg-white p-4">
        <h4 className="mb-1 text-[12px] font-semibold text-[#1B2A41]">QR code de site</h4>
        {sitesQrLoading ? (
          <p className="text-[12px] text-[#9CA3AF]">Chargement…</p>
        ) : siteActif ? (
          <SiteQrCard
            site={siteActif}
            onRegenerer={() => void regenererSiteMutation.mutateAsync(siteActif.id)}
            regenerationEnCours={regenererSiteMutation.isPending}
          />
        ) : (
          <Button
            loading={genererSiteMutation.isPending}
            onClick={() => void genererSiteMutation.mutateAsync(LIBELLE_SIEGE)}
          >
            <MapPin size={13} /> Générer le QR du siège
          </Button>
        )}
      </div>

      {codeGenere && (
        <div className="relative rounded-xl border border-[#4A7C6B]/25 bg-[#4A7C6B]/8 p-5 text-center">
          <button
            onClick={() => {
              setCodeGenere(null)
              setNomEmployeCodeGenere(null)
            }}
            aria-label="Fermer"
            className="absolute top-3 right-3 text-[#6B7280] hover:text-[#1B2A41]"
          >
            <X size={16} />
          </button>
          <p className="text-[11px] font-medium tracking-wider text-[#4A7C6B] uppercase">
            {nomEmployeCodeGenere
              ? `Code d'activation pour ${nomEmployeCodeGenere}`
              : "Code d'activation — communiquez-le maintenant"}
          </p>
          <p
            style={{ fontFamily: 'var(--font-code)' }}
            className="mt-2 text-[28px] font-semibold tracking-[0.3em] text-[#1B2A41]"
          >
            {codeGenere}
          </p>
          <p className="mt-2 text-[11px] text-[#9CA3AF]">
            {nomEmployeCodeGenere
              ? `Ce code a été envoyé par e-mail à ${nomEmployeCodeGenere}.`
              : "Ce code ne sera plus jamais affiché — saisissez-le sur l'appareil kiosque maintenant."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4">
        <div className="max-w-xs min-w-56 flex-1">
          <PersonSearch
            label="Employé"
            placeholder="Rechercher un employé…"
            personnes={employes}
            value={filtreEmployeId}
            onChange={setFiltreEmployeId}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              { valeur: '', label: 'Tous' },
              { valeur: 'en_attente', label: 'En attente' },
              { valeur: 'active', label: 'Active' },
              { valeur: 'expire', label: 'Expiré' },
              { valeur: 'revoquee', label: 'Révoquée' },
            ] as const
          ).map(({ valeur, label }) => (
            <button
              key={valeur}
              aria-label={`Filtrer par statut : ${label}`}
              onClick={() => setFiltreStatut(valeur)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                filtreStatut === valeur
                  ? 'bg-[#1B2A41] text-white'
                  : 'bg-[#F7F7F4] text-[#6B7280] hover:bg-[#D8D4CC]/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {(filtreEmployeId || filtreStatut) && (
          <button
            onClick={() => {
              setFiltreEmployeId('')
              setFiltreStatut('')
            }}
            className="text-[11px] text-[#9CA3AF] hover:text-[#1B2A41]"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              <SortableTh label="Type" champ="employe" tri={tri} onChange={handleTri} />
              <SortableTh label="Employé" champ="employe" tri={tri} onChange={handleTri} />
              <SortableTh label="Généré le" champ="emisLe" tri={tri} onChange={handleTri} />
              <SortableTh label="Statut" champ="statut" tri={tri} onChange={handleTri} />
              <SortableTh label="Activée le" champ="activeeLe" tri={tri} onChange={handleTri} />
              <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Chargement…
                </td>
              </tr>
            ) : (
              activationsTriees.map((a) => (
                <tr key={a.id} className="hover:bg-[#F7F7F4]">
                  <td className="px-4 py-3.5 text-[12px] text-[#1B2A41]">
                    {a.employeId ? (
                      <button
                        onClick={() => navigate(`/employes/${a.employeId}`)}
                        className="text-left font-medium text-[#1B2A41] hover:text-[#C92B6A] hover:underline"
                      >
                        {nomEmploye(a)}
                      </button>
                    ) : (
                      nomEmploye(a)
                    )}
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {dayjs(a.emisLe).format('DD/MM/YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag statut={estCodeExpire(a) ? 'Expiré' : formatStatut(a.statut)} />
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="px-4 py-3.5 text-[12px] text-[#6B7280]"
                  >
                    {a.activeeLe ? dayjs(a.activeeLe).format('DD/MM/YYYY HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {a.employeId && (
                        <button
                          disabled={genererPersonnelMutation.isPending}
                          onClick={() => {
                            setCodeGenere(null)
                            void genererPersonnelMutation.mutateAsync(a.employeId as string)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D8D4CC] px-2.5 py-1 text-[11px] text-[#6B7280] hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
                        >
                          <KeyRound size={11} /> Régénérer
                        </button>
                      )}
                      {a.statut !== 'revoquee' && (
                        <button
                          onClick={() => demanderRevocation(a.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#C1495A]/30 px-2.5 py-1 text-[11px] text-[#C1495A] hover:bg-[#C1495A]/8"
                        >
                          <Ban size={11} /> Révoquer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && (activations ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Aucune activation pour le moment.
                </td>
              </tr>
            )}
            {!isLoading && (activations ?? []).length > 0 && activationsFiltrees.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[13px] text-[#9CA3AF]">
                  Aucune activation pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// EF-ATT-18 : affiche prête à imprimer — le vrai QR est composé par-dessus le gabarit HB
// Développement (canvas, cf. posterSite.ts), téléchargeable en PNG ou PDF au choix de l'Admin, et
// prévisualisable en grand dans un nouvel onglet.
function SiteQrCard({
  site,
  onRegenerer,
  regenerationEnCours,
}: {
  site: SiteQrCodeReponse
  onRegenerer: () => void
  regenerationEnCours: boolean
}) {
  const [showFormats, setShowFormats] = useState(false)
  const [busy, setBusy] = useState(false)

  async function telecharger(format: 'png' | 'pdf') {
    setShowFormats(false)
    setBusy(true)
    try {
      await telechargerPosterSite(site, format)
    } catch {
      toast.error("Échec de la génération de l'affiche")
    } finally {
      setBusy(false)
    }
  }

  async function apercu() {
    setBusy(true)
    try {
      await apercuPosterSite(site)
    } catch {
      toast.error("Échec de la génération de l'affiche")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#D8D4CC] p-4 sm:flex-row sm:items-center">
      <div className="flex-shrink-0 self-center rounded-lg border border-[#D8D4CC] bg-white p-2">
        <QRCode value={site.valeur} size={96} />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
        <p className="text-[13px] font-semibold text-[#1B2A41]">{site.libelle}</p>
        <p className="text-[11px] text-[#9CA3AF]">
          Généré le{' '}
          <span style={{ fontFamily: 'var(--font-code)' }}>
            {dayjs(site.creeLe).format('DD/MM/YYYY HH:mm')}
          </span>
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-[#D8D4CC] pt-3 sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
        <button
          disabled={busy}
          onClick={() => void apercu()}
          className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
        >
          <Eye size={12} /> Aperçu
        </button>
        <div className="relative">
          <button
            disabled={busy}
            onClick={() => setShowFormats((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
          >
            <Download size={12} /> Télécharger
          </button>
          {showFormats && (
            <div className="absolute top-full right-0 z-10 mt-1 w-28 overflow-hidden rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
              <button
                onClick={() => void telecharger('png')}
                className="block w-full px-3 py-2 text-left text-[11px] text-[#1B2A41] hover:bg-[#F7F7F4]"
              >
                PNG
              </button>
              <button
                onClick={() => void telecharger('pdf')}
                className="block w-full px-3 py-2 text-left text-[11px] text-[#1B2A41] hover:bg-[#F7F7F4]"
              >
                PDF
              </button>
            </div>
          )}
        </div>
        <button
          disabled={regenerationEnCours}
          onClick={onRegenerer}
          className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
        >
          <KeyRound size={12} /> Régénérer
        </button>
      </div>
    </div>
  )
}
