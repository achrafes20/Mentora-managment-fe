import dayjs from 'dayjs'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  FileCheck,
  Mail,
  Move,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from '@/components/ui/toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import type { ApiError } from '@/lib/apiClient'
import { EmployeeBadge } from '@/components/ui/EmployeeBadge'
import { CornerMark } from '@/components/ui/CornerMark'
import { StatusTag } from '@/components/ui/StatusTag'
import { EmailLink } from '@/components/ui/EmailLink'
import { WhatsappLink } from '@/components/ui/WhatsappLink'
import { Input } from '@/components/ui/Input'
import { formatStatut } from '@/components/ui/tokens'
import { EmployeFormModal, type EmployeFormValues } from './EmployeFormModal'
import { CarteEmailModal } from './CarteEmailModal'
import { telechargerCarteEmploye } from './carteUtils'
import { DepartureModal, TransferModal } from './EmployeModals'
import { ouvrirDocument } from './employesApi'
import { useDepartements } from './useDepartements'
import {
  useAttacherDocument,
  useDesactiverEmploye,
  useDocumentsEmploye,
  useEmploye,
  useHistoriqueTransferts,
  useModifierEmploye,
  useModifierSalaire,
  useModifierSujetStage,
  useTransfererEmploye,
  useSupprimerDocument,
  useEnvoyerCarteEmail,
  CLE_EMPLOYES,
} from './useEmployes'
import { televerserPhotoEmploye, modifierSalaireEmploye } from './employesApi'
import { libelleManager, useManagers } from './useManagers'
import {
  genererQrCode,
  listerPointagesEmploye,
  qrCodeActif,
  type PointageReponse,
  type QrCodeReponse,
} from '../attendance/api'
import { EmployeTeletravailCard } from '../attendance/EmployeTeletravailCard'
import {
  useApercuCertificatTravail,
  useApercuCertificatStage,
  useApercuAttestationTravail,
  useApercuAttestationSalaire,
  useEnvoyerCertificatTravail,
  useEnvoyerCertificatStage,
  useEnvoyerAttestationTravail,
  useEnvoyerAttestationSalaire,
  useEnvoisDocuments,
} from '../documents/useDocuments'

type Tab = 'profil' | 'presence' | 'documents'

export function EmployeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const estAdmin = role === 'admin'

  const { data: employe, isLoading, error } = useEmploye(id)
  const { data: departements } = useDepartements()
  const { data: managers } = useManagers()
  const { data: documents } = useDocumentsEmploye(id)
  const { data: envoisDocuments } = useEnvoisDocuments(id)
  const { data: transferts } = useHistoriqueTransferts(id)

  const modifierMutation = useModifierEmploye(id ?? '')
  const transfererMutation = useTransfererEmploye(id ?? '')
  const desactiverMutation = useDesactiverEmploye(id ?? '')
  const envoyerCertifTravailMutation = useEnvoyerCertificatTravail()
  const envoyerCertifStageMutation = useEnvoyerCertificatStage()
  const envoyerAttestationMutation = useEnvoyerAttestationTravail()
  const envoyerAttestationSalaireMutation = useEnvoyerAttestationSalaire()
  const apercuCertifTravailMutation = useApercuCertificatTravail()
  const apercuCertifStageMutation = useApercuCertificatStage()
  const apercuAttestationMutation = useApercuAttestationTravail()
  const apercuAttestationSalaireMutation = useApercuAttestationSalaire()
  const attacherMutation = useAttacherDocument(id ?? '')
  const supprimerDocMutation = useSupprimerDocument(id ?? '')
  const envoyerCarteMutation = useEnvoyerCarteEmail(id ?? '')
  const badgeRef = useRef<HTMLDivElement>(null)
  const BADGE_DISPLAY_SCALE = 0.4

  const [tab, setTab] = useState<Tab>('profil')
  const [modaleEdition, setModaleEdition] = useState(false)
  const [modaleTransfert, setModaleTransfert] = useState(false)
  const [modaleDeparture, setModaleDeparture] = useState(false)
  const [modaleEmailCarte, setModaleEmailCarte] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [qr, setQr] = useState<QrCodeReponse | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [certEnvoye, setCertEnvoye] = useState(false)
  const [attestationEnvoyee, setAttestationEnvoyee] = useState(false)
  const [attestationSalaireEnvoyee, setAttestationSalaireEnvoyee] = useState(false)
  const [pointages, setPointages] = useState<PointageReponse[]>([])
  const [pointagesLoading, setPointagesLoading] = useState(false)

  const chargerQr = useCallback(async () => {
    if (!id) return
    try {
      const actif = await qrCodeActif(id)
      // EF-ATT-01 : un QR doit exister dès la création de la fiche employé. Si aucun n'est
      // encore actif (fiche créée avant que cet écran ne le génère, ou jamais généré), on le
      // crée automatiquement ici plutôt que d'exiger un clic manuel sur "Régénérer la carte"
      // (qui reste disponible pour une vraie rotation, ex. badge perdu). `genererQrCode` est
      // Admin uniquement côté backend — un Manager qui consulte une fiche sans QR verra juste
      // rester vide, sans erreur visible (comportement inchangé pour lui).
      setQr(actif ?? (await genererQrCode(id)))
    } catch {
      setQr(null)
    }
  }, [id])

  const chargerPointages = useCallback(async () => {
    if (!id) return
    setPointagesLoading(true)
    try {
      const res = await listerPointagesEmploye(id, 0, 50)
      setPointages(res.content)
    } catch {
      toast.error('Erreur au chargement des pointages')
    } finally {
      setPointagesLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerQr()
  }, [chargerQr])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 'presence') void chargerPointages()
  }, [tab, chargerPointages])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-[13px] text-[#9CA3AF]">Chargement…</p>
      </div>
    )
  }

  if (error || !employe) {
    return (
      <div className="p-8">
        <p className="text-[13px] text-[#C1495A]">Employé introuvable</p>
      </div>
    )
  }

  const managerNom =
    managers?.find((m) => m.id === employe.managerId) != null
      ? libelleManager(managers!.find((m) => m.id === employe.managerId)!)
      : '—'

  const statutLabel = formatStatut(employe.statut ?? '')
  const isActif = employe.statut === 'actif'
  const isCdd = employe.typeContrat === 'CDD'
  const isCdiCdd = employe.typeContrat === 'CDI' || employe.typeContrat === 'CDD'
  const estStagiaire = employe.typeContrat?.startsWith('STAGIAIRE')
  const envoi = envoisDocuments?.find((e) =>
    estStagiaire ? e.typeDocument === 'certificat_stage' : e.typeDocument === 'certificat_travail',
  )
  const dejaEnvoye = !!envoi
  const envoiAttestation = envoisDocuments?.find((e) => e.typeDocument === 'attestation_travail')
  const envoiAttestationSalaire = envoisDocuments?.find(
    (e) => e.typeDocument === 'attestation_salaire',
  )

  const joursRestantsCdd =
    employe.dateFinContratPrevue != null
      ? dayjs(employe.dateFinContratPrevue).diff(dayjs(), 'day')
      : null
  // isActif : une fois l'employé désactivé (départ effectif, y compris l'auto-désactivation à
  // échéance), cette alerte "à venir" n'a plus de sens — l'info de départ (date + motif) est déjà
  // affichée ailleurs sur la fiche.
  const cddAlert = isActif && isCdd && joursRestantsCdd != null && joursRestantsCdd <= 15

  const joursRestantsStage =
    employe.dateFinStagePrevue != null
      ? dayjs(employe.dateFinStagePrevue).diff(dayjs(), 'day')
      : null
  const stageAlert =
    isActif && estStagiaire && joursRestantsStage != null && joursRestantsStage <= 3

  async function handleGenererQr() {
    if (!id) return
    setQrLoading(true)
    try {
      setQr(await genererQrCode(id))
      void toast.success('Carte badge régénérée')
    } catch {
      void toast.error('Erreur lors de la génération')
    } finally {
      setQrLoading(false)
    }
  }

  const handleEnvoyerCertificat = async () => {
    try {
      if (estStagiaire) {
        if (!employe.id) {
          throw new Error('Employé introuvable')
        }
        await envoyerCertifStageMutation.mutateAsync({
          employeId: employe.id,
          sujetStage: employe.sujetStage || undefined,
        })
      } else {
        if (!employe.id) {
          throw new Error('Employé introuvable')
        }
        await envoyerCertifTravailMutation.mutateAsync(employe.id)
      }
      setCertEnvoye(true)
      void toast.success('Certificat envoyé avec succès')
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'envoi du certificat")
    }
  }

  const handleEnvoyerAttestation = async () => {
    if (!employe.id) return
    try {
      await envoyerAttestationMutation.mutateAsync(employe.id)
      setAttestationEnvoyee(true)
      void toast.success('Attestation de travail envoyée avec succès')
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'envoi de l'attestation")
    }
  }

  // Aperçu du PDF avant confirmation d'envoi (EF-DOC) — ouvre le même document dans un nouvel
  // onglet, sans e-mail ni entrée dans l'historique des envois.
  const handleApercuCertificat = async () => {
    if (!employe.id) return
    try {
      if (estStagiaire) {
        await apercuCertifStageMutation.mutateAsync({
          employeId: employe.id,
          sujetStage: employe.sujetStage || undefined,
        })
      } else {
        await apercuCertifTravailMutation.mutateAsync(employe.id)
      }
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'aperçu du certificat")
    }
  }

  const handleApercuAttestation = async () => {
    if (!employe.id) return
    try {
      await apercuAttestationMutation.mutateAsync(employe.id)
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'aperçu de l'attestation")
    }
  }

  const handleEnvoyerAttestationSalaire = async () => {
    if (!employe.id) return
    try {
      await envoyerAttestationSalaireMutation.mutateAsync(employe.id)
      setAttestationSalaireEnvoyee(true)
      void toast.success('Attestation de salaire envoyée avec succès')
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'envoi de l'attestation de salaire")
    }
  }

  const handleApercuAttestationSalaire = async () => {
    if (!employe.id) return
    try {
      await apercuAttestationSalaireMutation.mutateAsync(employe.id)
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'aperçu de l'attestation de salaire")
    }
  }

  function nomDept(deptId?: string) {
    return departements?.find((d) => d.id === deptId)?.nom ?? deptId ?? '—'
  }

  function nomManager(mgrId?: string) {
    const m = managers?.find((x) => x.id === mgrId)
    return m ? `${m.prenom} ${m.nom}` : '—'
  }

  async function handleTelechargerCarte() {
    if (!badgeRef.current || !employe) return
    try {
      await telechargerCarteEmploye(
        badgeRef.current,
        `carte-${employe.prenom}-${employe.nom}`.replace(/\s+/g, '-').toLowerCase(),
      )
      void toast.success('Carte téléchargée')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      void toast.error('Erreur lors du téléchargement: ' + msg)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      {modaleTransfert && (
        <TransferModal
          employe={employe}
          departements={departements ?? []}
          managers={managers ?? []}
          submitting={transfererMutation.isPending}
          onClose={() => setModaleTransfert(false)}
          onConfirm={(v) => {
            transfererMutation
              .mutateAsync(v)
              .then(() => {
                void toast.success('Employé transféré')
                setModaleTransfert(false)
                setErreur(null)
              })
              .catch((err: ApiError) => setErreur(err.message))
          }}
        />
      )}

      {modaleDeparture && (
        <DepartureModal
          employe={employe}
          submitting={desactiverMutation.isPending}
          onClose={() => setModaleDeparture(false)}
          onConfirm={(v, genererCertificat) => {
            desactiverMutation
              .mutateAsync(v)
              .then(async () => {
                void toast.success('Employé désactivé')
                setModaleDeparture(false)
                setErreur(null)
                if (genererCertificat) {
                  await handleEnvoyerCertificat()
                }
              })
              .catch((err: ApiError) => setErreur(err.message))
          }}
        />
      )}

      <EmployeFormModal
        open={modaleEdition}
        mode="edition"
        employe={employe}
        departements={departements ?? []}
        managers={managers ?? []}
        onCancel={() => setModaleEdition(false)}
        submitting={modifierMutation.isPending}
        errorMessage={erreur}
        onSubmit={(values: EmployeFormValues, photo?: File | null) => {
          modifierMutation
            .mutateAsync({
              nom: values.nom,
              prenom: values.prenom,
              email: values.email || undefined,
              telephone: values.telephone || undefined,
              poste: values.poste || undefined,
              dateEmbauche: format(values.dateEmbauche, 'yyyy-MM-dd'),
              typeContrat: values.typeContrat,
              dateFinContratPrevue: values.dateFinContratPrevue
                ? format(values.dateFinContratPrevue, 'yyyy-MM-dd')
                : undefined,
              dateFinStagePrevue: values.dateFinStagePrevue
                ? format(values.dateFinStagePrevue, 'yyyy-MM-dd')
                : undefined,
              sexe: values.sexe || undefined,
              cin: values.cin || undefined,
              sujetStage: values.sujetStage || undefined,
              numeroCnss: values.numeroCnss || undefined,
              numeroAmo: values.numeroAmo || undefined,
              numeroCimr: values.numeroCimr || undefined,
              rib: values.rib || undefined,
              periodeEssaiFinLe: values.periodeEssaiFinLe
                ? format(values.periodeEssaiFinLe, 'yyyy-MM-dd')
                : undefined,
            })
            .then(async () => {
              if (photo && id) {
                await televerserPhotoEmploye(id, photo)
              }
              if (values.salaireBrutMensuel !== (employe?.salaireBrutMensuel ?? null) && id) {
                await modifierSalaireEmploye(id, values.salaireBrutMensuel)
              }
              if (id) {
                await queryClient.invalidateQueries({ queryKey: CLE_EMPLOYES })
                await queryClient.invalidateQueries({ queryKey: ['employes', id] })
              }
              void toast.success('Employé modifié')
              setModaleEdition(false)
              setErreur(null)
            })
            .catch((err: ApiError) => setErreur(err.message))
        }}
      />

      {modaleEmailCarte && employe && (
        <CarteEmailModal
          open
          employe={employe}
          submitting={envoyerCarteMutation.isPending}
          onClose={() => setModaleEmailCarte(false)}
          onConfirm={(payload) => {
            envoyerCarteMutation
              .mutateAsync(payload)
              .then(() => {
                void toast.success('E-mail envoyé')
                setModaleEmailCarte(false)
              })
              .catch((err: ApiError) => void toast.error(err.message))
          }}
        />
      )}

      <div className="p-8">
        <button
          onClick={() => navigate('/employes')}
          className="mb-6 flex items-center gap-1.5 text-[12px] text-[#9CA3AF] transition-colors hover:text-[#1B2A41]"
        >
          <ArrowLeft size={13} /> Retour à la liste
        </button>

        {/* modaleEdition affiche déjà erreur dans son propre Alert (EmployeFormModal) — l'afficher
            aussi ici en même temps dupliquait le message derrière la modale (illisible tant
            qu'elle n'est pas fermée). Ce bandeau ne sert donc que pour transfert/désactivation,
            qui n'ont pas encore leur propre affichage inline. */}
        {erreur && !modaleEdition && (
          <div className="mb-4 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[12px] text-[#C1495A]">
            {erreur}
          </div>
        )}

        <div className="mb-8 flex items-start gap-7">
          <div className="flex flex-col items-center gap-3">
            <EmployeeBadge
              ref={badgeRef}
              employe={employe}
              qrValue={qr?.valeur}
              scale={BADGE_DISPLAY_SCALE}
            />
            <div className="flex gap-2">
              <button
                onClick={() => void handleTelechargerCarte()}
                className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#243650]"
              >
                <Download size={11} /> Télécharger
              </button>
              {estAdmin && (
                <button
                  onClick={() => setModaleEmailCarte(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#243650]"
                >
                  <Mail size={11} /> Envoyer
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 pt-1">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h1
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-[22px] font-semibold text-[#1B2A41]"
                >
                  {employe.prenom} {employe.nom}
                </h1>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">
                  {employe.poste ?? '—'} · {employe.departementNom ?? '—'}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <StatusTag statut={statutLabel} />
                  <span
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="text-[11px] text-[#9CA3AF]"
                  >
                    {employe.id?.substring(0, 8).toUpperCase()}
                  </span>
                  {employe.dateEmbauche && (
                    <span className="text-[11px] text-[#9CA3AF]">
                      Depuis le{' '}
                      <span style={{ fontFamily: 'var(--font-code)' }}>
                        {dayjs(employe.dateEmbauche).format('DD/MM/YYYY')}
                      </span>
                    </span>
                  )}
                  {cddAlert && employe.dateFinContratPrevue && (
                    <span className="flex items-center gap-1 rounded border border-[#C87F3A]/25 bg-[#C87F3A]/10 px-2 py-0.5 text-[10px] font-medium text-[#C87F3A]">
                      <AlertTriangle size={9} /> Fin de contrat prévue le{' '}
                      {dayjs(employe.dateFinContratPrevue).format('DD/MM/YYYY')}
                    </span>
                  )}
                  {stageAlert && employe.dateFinStagePrevue && (
                    <span className="flex items-center gap-1 rounded border border-[#C87F3A]/25 bg-[#C87F3A]/10 px-2 py-0.5 text-[10px] font-medium text-[#C87F3A]">
                      <AlertTriangle size={9} /> Fin de stage prévue le{' '}
                      {dayjs(employe.dateFinStagePrevue).format('DD/MM/YYYY')}
                    </span>
                  )}
                  {qr?.bloque && (
                    <span className="text-[10px] font-medium text-[#C1495A]">QR bloqué</span>
                  )}
                </div>
              </div>
              {estAdmin && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setModaleEdition(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                  >
                    <Pencil size={11} /> Modifier
                  </button>
                  <button
                    onClick={() => void handleGenererQr()}
                    disabled={qrLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={qrLoading ? 'animate-spin' : ''} /> Régénérer la
                    carte
                  </button>
                  {isActif && (
                    <button
                      onClick={() => setModaleTransfert(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                    >
                      <Move size={11} /> Transférer
                    </button>
                  )}
                  {isActif && (
                    <button
                      onClick={() => setModaleDeparture(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#C1495A]/30 px-3 py-1.5 text-[11px] text-[#C1495A] transition-colors hover:bg-[#C1495A]/8"
                    >
                      Désactiver l'employé
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-3">
              {[
                { label: 'Manager', value: managerNom },
                { label: 'Contrat', value: formatStatut(employe.typeContrat ?? '') },
                { label: 'Email', value: <EmailLink email={employe.email} /> },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#D8D4CC]/60 bg-[#F7F7F4] px-3.5 py-2.5"
                >
                  <p className="text-[9px] tracking-wider text-[#9CA3AF] uppercase">{label}</p>
                  <p className="mt-0.5 truncate text-[12px] font-medium text-[#1B2A41]">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#D8D4CC]/60 bg-[#F7F7F4] px-3.5 py-2.5">
              <div>
                <p className="mb-1 text-[9px] tracking-wider text-[#9CA3AF] uppercase">
                  Solde de congés
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-[24px] leading-none font-semibold text-[#4A7C6B]"
                  >
                    —
                  </span>
                  <span className="text-[12px] text-[#6B7280]">
                    jours (module demandes à venir)
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/demandes?tab=registre&employeId=${employe.id}`)}
                className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[#4A7C6B] hover:underline"
              >
                <BookOpen size={11} /> Voir le registre des mouvements
              </button>
            </div>

            {estStagiaire && employe.id && (
              <div className="mt-3 rounded-lg border border-[#D8D4CC]/60 bg-[#F7F7F4] px-3.5 py-2.5">
                <p className="mb-1 text-[9px] tracking-wider text-[#9CA3AF] uppercase">
                  Sujet de stage
                </p>
                {estAdmin || role === 'manager' ? (
                  <SujetStageInline
                    key={employe.sujetStage ?? ''}
                    employeId={employe.id}
                    valeur={employe.sujetStage}
                  />
                ) : (
                  <p className="text-[12px] font-medium text-[#1B2A41]">
                    {employe.sujetStage || '—'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-6 border-b border-[#D8D4CC]">
          {(
            [
              { key: 'profil', label: 'Profil' },
              { key: 'presence', label: 'Historique de présence' },
              { key: 'documents', label: 'Documents' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 pb-3 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? 'border-[#1B2A41] text-[#1B2A41]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profil' && (
          <>
            <div className="rounded-xl border border-[#D8D4CC] bg-white p-6">
              <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                Informations personnelles
              </p>
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                {[
                  ['Nom complet', `${employe.prenom} ${employe.nom}`],
                  ['Email professionnel', <EmailLink key="email" email={employe.email} />],
                  ['Département', employe.departementNom ?? '—'],
                  ['Manager direct', managerNom],
                  ['Type de contrat', formatStatut(employe.typeContrat ?? '')],
                  [
                    "Date d'embauche",
                    employe.dateEmbauche ? dayjs(employe.dateEmbauche).format('DD/MM/YYYY') : '—',
                  ],
                  ['Téléphone', <WhatsappLink key="telephone" telephone={employe.telephone} />],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-[#D8D4CC]/50 pb-3">
                    <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">{label}</p>
                    <p className="mt-0.5 text-[13px] text-[#1B2A41]">{value}</p>
                  </div>
                ))}

                {isCdd && (
                  <div
                    className={`col-span-1 border-b border-[#D8D4CC]/50 pb-3 ${cddAlert ? '-mx-2 rounded bg-[#C87F3A]/4 px-2' : ''}`}
                  >
                    <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                      Date de fin de contrat prévue
                    </p>
                    {employe.dateFinContratPrevue ? (
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-[13px] text-[#1B2A41]">
                          {dayjs(employe.dateFinContratPrevue).format('DD/MM/YYYY')}
                        </p>
                        {cddAlert && joursRestantsCdd != null && (
                          <span className="rounded bg-[#C87F3A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#C87F3A]">
                            J−{joursRestantsCdd}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[13px] text-[#9CA3AF] italic">Non renseignée</p>
                    )}
                  </div>
                )}

                {estStagiaire && (
                  <div
                    className={`col-span-1 border-b border-[#D8D4CC]/50 pb-3 ${stageAlert ? '-mx-2 rounded bg-[#C87F3A]/4 px-2' : ''}`}
                  >
                    <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                      Date de fin de stage prévue
                    </p>
                    {employe.dateFinStagePrevue ? (
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-[13px] text-[#1B2A41]">
                          {dayjs(employe.dateFinStagePrevue).format('DD/MM/YYYY')}
                        </p>
                        {stageAlert && joursRestantsStage != null && (
                          <span className="rounded bg-[#C87F3A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#C87F3A]">
                            J−{joursRestantsStage}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[13px] text-[#9CA3AF] italic">Non renseignée</p>
                    )}
                  </div>
                )}

                {!isActif && employe.dateDepart && (
                  <div className="col-span-1 border-b border-[#D8D4CC]/50 pb-3">
                    <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                      Date de départ effective
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#6B7280]">
                      {dayjs(employe.dateDepart).format('DD/MM/YYYY')}
                      {employe.motifDepart ? ` — ${employe.motifDepart}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {estAdmin && (
              <div className="mt-4 rounded-xl border border-[#D8D4CC] bg-white p-6">
                <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Conformité RH
                </p>
                <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                  {[
                    ['N° CNSS', employe.numeroCnss ?? '—'],
                    ['N° AMO', employe.numeroAmo ?? '—'],
                    ['N° CIMR', employe.numeroCimr ?? '—'],
                    ['RIB', employe.rib ?? '—'],
                    [
                      "Fin de période d'essai",
                      employe.periodeEssaiFinLe
                        ? dayjs(employe.periodeEssaiFinLe).format('DD/MM/YYYY')
                        : '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-[#D8D4CC]/50 pb-3">
                      <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">{label}</p>
                      <p className="mt-0.5 text-[13px] text-[#1B2A41]">{value}</p>
                    </div>
                  ))}
                  {employe.id && (
                    <div className="border-b border-[#D8D4CC]/50 pb-3">
                      <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                        Salaire brut mensuel
                      </p>
                      <div className="mt-0.5">
                        <SalaireInline
                          key={employe.salaireBrutMensuel ?? 'none'}
                          employeId={employe.id}
                          valeur={employe.salaireBrutMensuel}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {employe.id && (
              <div className="mt-4">
                <EmployeTeletravailCard employeId={employe.id} estAdmin={estAdmin} />
              </div>
            )}

            {(transferts?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-xl border border-[#D8D4CC] bg-white p-5">
                <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Historique des rattachements
                </p>
                <div className="space-y-2">
                  {transferts!.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 text-[12px]">
                      <span
                        style={{ fontFamily: 'var(--font-code)' }}
                        className="w-24 flex-shrink-0 text-[#9CA3AF]"
                      >
                        {t.dateEffet ? dayjs(t.dateEffet).format('DD/MM/YYYY') : '—'}
                      </span>
                      <span className="text-[#6B7280]">
                        {nomDept(t.ancienDepartementId)} / {nomManager(t.ancienManagerId)}
                      </span>
                      <ArrowRight size={12} className="flex-shrink-0 text-[#D8D4CC]" />
                      <span className="font-medium text-[#1B2A41]">
                        {nomDept(t.nouveauDepartementId)} / {nomManager(t.nouveauManagerId)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isActif && isCdiCdd && (
              <div className="mt-4 rounded-xl border border-[#D8D4CC] bg-white p-5">
                <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Documents administratifs
                </p>
                <div className="relative flex items-center gap-5 rounded-xl border border-[#D8D4CC] bg-[#F7F7F4] p-4">
                  <CornerMark />
                  <FileCheck size={18} className="flex-shrink-0 text-[#4A7C6B]" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#1B2A41]">
                      Attestation de travail
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {employe.prenom} {employe.nom} · {formatStatut(employe.typeContrat ?? '')} ·
                      toujours en poste
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(envoiAttestation || attestationEnvoyee) && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#4A7C6B]">
                        ✓ Envoyée
                      </span>
                    )}
                    <button
                      onClick={() => void handleApercuAttestation()}
                      disabled={apercuAttestationMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
                    >
                      <ExternalLink size={11} /> Aperçu
                    </button>
                    {estAdmin && (
                      <button
                        onClick={() => void handleEnvoyerAttestation()}
                        disabled={envoyerAttestationMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#243650] disabled:opacity-50"
                      >
                        <Send size={11} />{' '}
                        {envoiAttestation || attestationEnvoyee ? 'Renvoyer' : "Confirmer l'envoi"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isActif && isCdiCdd && estAdmin && (
              <div className="mt-4 rounded-xl border border-[#D8D4CC] bg-white p-5">
                <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Attestation de salaire
                </p>
                <div className="relative flex items-center gap-5 rounded-xl border border-[#D8D4CC] bg-[#F7F7F4] p-4">
                  <CornerMark />
                  <FileCheck size={18} className="flex-shrink-0 text-[#4A7C6B]" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#1B2A41]">
                      Attestation de salaire
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {employe.salaireBrutMensuel
                        ? `${employe.salaireBrutMensuel} MAD brut/mois`
                        : 'Salaire non renseigné — requis avant génération'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(envoiAttestationSalaire || attestationSalaireEnvoyee) && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#4A7C6B]">
                        ✓ Envoyée
                      </span>
                    )}
                    <button
                      onClick={() => void handleApercuAttestationSalaire()}
                      disabled={
                        apercuAttestationSalaireMutation.isPending || !employe.salaireBrutMensuel
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
                    >
                      <ExternalLink size={11} /> Aperçu
                    </button>
                    <button
                      onClick={() => void handleEnvoyerAttestationSalaire()}
                      disabled={
                        envoyerAttestationSalaireMutation.isPending || !employe.salaireBrutMensuel
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#243650] disabled:opacity-50"
                    >
                      <Send size={11} />{' '}
                      {envoiAttestationSalaire || attestationSalaireEnvoyee
                        ? 'Renvoyer'
                        : "Confirmer l'envoi"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isActif && (isCdiCdd || estStagiaire) && (
              <div className="mt-4 rounded-xl border border-[#D8D4CC] bg-white p-5">
                <p className="mb-4 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Documents de fin de contrat
                </p>
                <div className="relative flex items-center gap-5 rounded-xl border border-[#D8D4CC] bg-[#F7F7F4] p-4">
                  <CornerMark />
                  <FileCheck size={18} className="flex-shrink-0 text-[#4A7C6B]" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#1B2A41]">
                      {estStagiaire ? 'Certificat de stage' : 'Certificat de travail'}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {employe.prenom} {employe.nom} · {formatStatut(employe.typeContrat ?? '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(dejaEnvoye || certEnvoye) && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#4A7C6B]">
                        ✓ Envoyé
                      </span>
                    )}
                    <button
                      onClick={() => void handleApercuCertificat()}
                      disabled={
                        apercuCertifTravailMutation.isPending || apercuCertifStageMutation.isPending
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41] disabled:opacity-50"
                    >
                      <ExternalLink size={11} /> Aperçu
                    </button>
                    {estAdmin && (
                      <button
                        onClick={() => void handleEnvoyerCertificat()}
                        disabled={
                          envoyerCertifTravailMutation.isPending ||
                          envoyerCertifStageMutation.isPending
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-[#1B2A41] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#243650] disabled:opacity-50"
                      >
                        <Send size={11} />{' '}
                        {dejaEnvoye || certEnvoye ? 'Renvoyer' : "Confirmer l'envoi"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'presence' && (
          <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
            {pointagesLoading ? (
              <p className="p-6 text-center text-[13px] text-[#9CA3AF]">Chargement…</p>
            ) : pointages.length === 0 ? (
              <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
                Aucun pointage enregistré
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                    {['Type', 'Horodatage', 'Correction'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pointages.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                    >
                      <td className="px-5 py-3.5">
                        <StatusTag statut={p.typeScan === 'entree' ? 'Entrée' : 'Sortie'} />
                      </td>
                      <td
                        style={{ fontFamily: 'var(--font-code)' }}
                        className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                      >
                        {dayjs(p.horodatage).format('DD/MM/YYYY HH:mm:ss')}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.corrigeManuellement ? (
                          <StatusTag statut="Corrigé" />
                        ) : (
                          <span className="text-[12px] text-[#9CA3AF]">Original</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-2.5">
            {estAdmin && (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#D8D4CC] bg-white px-5 py-3 text-[12px] text-[#6B7280] hover:border-[#1B2A41]">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      attacherMutation.mutate(
                        { fichier: f, typeDocument: 'autre' },
                        {
                          onSuccess: () => void toast.success('Document ajouté'),
                          onError: (err) =>
                            void toast.error(
                              (err as unknown as ApiError).message ?? 'Erreur lors de l’upload',
                            ),
                        },
                      )
                    }
                  }}
                />
                + Ajouter un document
              </label>
            )}
            {(documents?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#9CA3AF]">Aucun document</p>
            ) : (
              documents!.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-[#D8D4CC] bg-white px-5 py-3.5 transition-colors hover:bg-[#F7F7F4]"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck size={15} className="text-[#4A7C6B]" />
                    <span className="text-[13px] text-[#1B2A41]">{doc.nomOriginal}</span>
                    {doc.typeDocument && (
                      <span className="rounded bg-[#D8D4CC]/40 px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                        {doc.typeDocument}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        ouvrirDocument(id!, doc.id as string).catch(
                          (err: ApiError) => void toast.error(err.message),
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CC] px-3 py-1.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#1B2A41] hover:text-[#1B2A41]"
                    >
                      <Download size={11} /> Télécharger
                    </button>
                    {estAdmin && (
                      <>
                        <button
                          onClick={() => {
                            if (!doc.id) return
                            if (!window.confirm('Supprimer ce document ?')) return
                            supprimerDocMutation.mutate(doc.id as string, {
                              onSuccess: () => void toast.success('Document supprimé'),
                              onError: (err) =>
                                void toast.error(
                                  (err as unknown as ApiError).message ??
                                    'Erreur lors de la suppression',
                                ),
                            })
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-[#C1495A]/30 px-3 py-1.5 text-[11px] text-[#C1495A] transition-colors hover:border-[#C1495A] hover:bg-[#C1495A]/5"
                        >
                          <Trash2 size={11} /> Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// EF-EMP-01 : seul champ de la fiche qu'un Manager (dans son propre département) est autorisé à
// modifier, contrairement au reste du formulaire réservé à l'Admin — cf. EmployeController.
function SujetStageInline({ employeId, valeur }: { employeId: string; valeur?: string | null }) {
  const [editing, setEditing] = useState(false)
  const [texte, setTexte] = useState(valeur ?? '')
  const mutation = useModifierSujetStage(employeId)

  async function enregistrer() {
    try {
      await mutation.mutateAsync(texte.trim())
      setEditing(false)
      void toast.success('Sujet de stage enregistré')
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'enregistrement")
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        {valeur && <span className="text-[12px] font-medium text-[#1B2A41]">{valeur}</span>}
        <button
          onClick={() => setEditing(true)}
          className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[#4A7C6B] hover:underline"
        >
          <Pencil size={11} /> {valeur ? 'Modifier' : 'Ajouter le sujet'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Sujet de stage"
        className="w-56"
      />
      <button
        onClick={() => void enregistrer()}
        disabled={mutation.isPending}
        className="rounded-lg bg-[#1B2A41] px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
      >
        Enregistrer
      </button>
      <button
        onClick={() => {
          setEditing(false)
          setTexte(valeur ?? '')
        }}
        className="text-[11px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        Annuler
      </button>
    </div>
  )
}

// EF-DOC-14 : édition ciblée du salaire brut mensuel — Admin uniquement, même patron que
// SujetStageInline ci-dessus.
function SalaireInline({ employeId, valeur }: { employeId: string; valeur?: number | null }) {
  const [editing, setEditing] = useState(false)
  const [texte, setTexte] = useState(valeur != null ? String(valeur) : '')
  const mutation = useModifierSalaire(employeId)

  async function enregistrer() {
    const nombre = texte.trim() === '' ? null : Number(texte)
    if (nombre !== null && (Number.isNaN(nombre) || nombre < 0)) {
      void toast.error('Montant invalide')
      return
    }
    try {
      await mutation.mutateAsync(nombre)
      setEditing(false)
      void toast.success('Salaire enregistré')
    } catch (err) {
      const apiError = err as ApiError
      void toast.error(apiError.message ?? "Erreur lors de l'enregistrement")
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        {valeur != null && <span className="text-[13px] text-[#1B2A41]">{valeur} MAD</span>}
        <button
          onClick={() => setEditing(true)}
          className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[#4A7C6B] hover:underline"
        >
          <Pencil size={11} /> {valeur != null ? 'Modifier' : 'Renseigner'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Salaire brut mensuel (MAD)"
        className="w-40"
      />
      <button
        onClick={() => void enregistrer()}
        disabled={mutation.isPending}
        className="rounded-lg bg-[#1B2A41] px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
      >
        Enregistrer
      </button>
      <button
        onClick={() => {
          setEditing(false)
          setTexte(valeur != null ? String(valeur) : '')
        }}
        className="text-[11px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        Annuler
      </button>
    </div>
  )
}
