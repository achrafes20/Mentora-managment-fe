import { toast } from '@/components/ui/toast'
import { Camera, CheckCircle2, History, LogIn, LogOut, WifiOff, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'
import { QrScanner } from './QrScanner'
import {
  mesPointagesRecents,
  scannerPersonnel,
  statutActivationAppareil,
  type PointageReponse,
} from './api'
import { KiosqueActivationPrompt } from './KiosqueActivationPrompt'
import {
  effacerJetonAppareilPersonnel,
  enregistrerJetonAppareilPersonnel,
  lireJetonAppareilPersonnel,
} from './mobileDevice'

type EtatActivation = 'verification' | 'requise' | 'active'

// EF-ATT-17 : bip synthétisé (Web Audio API) — pas de fichier audio à charger/héberger, et un son
// distinct succès/erreur aide un employé qui ne regarde pas l'écran (scan à la volée en entrant).
function jouerBip(succes: boolean) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = succes ? 880 : 220
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // Web Audio indisponible (navigateur trop ancien, contexte bloqué) : dégradation silencieuse,
    // le retour visuel suffit.
  }
}

function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine)
  useEffect(() => {
    function surChangement() {
      setEnLigne(navigator.onLine)
    }
    window.addEventListener('online', surChangement)
    window.addEventListener('offline', surChangement)
    return () => {
      window.removeEventListener('online', surChangement)
      window.removeEventListener('offline', surChangement)
    }
  }, [])
  return enLigne
}

/**
 * EF-ATT-17 : pointage depuis le téléphone personnel de l'employé — page publique, accessible
 * sans session JWT. Deux preuves distinctes : l'appareil est appairé à l'employé une fois
 * (identité), puis chaque pointage exige de scanner le QR affiché au lieu de travail (présence
 * physique) — plus réaliste en multi-sites qu'un écran partagé unique par site.
 */
export function MobilePointagePage() {
  const [etatActivation, setEtatActivation] = useState<EtatActivation>('verification')

  useEffect(() => {
    let annule = false
    async function verifier() {
      const jeton = lireJetonAppareilPersonnel()
      const actif = await statutActivationAppareil(jeton).catch(() => false)
      if (annule) return
      if (!actif) effacerJetonAppareilPersonnel()
      setEtatActivation(actif ? 'active' : 'requise')
    }
    void verifier()
    return () => {
      annule = true
    }
  }, [])

  if (etatActivation === 'verification') {
    return <div className="min-h-screen bg-[#F7F7F4]" />
  }
  if (etatActivation === 'requise') {
    return (
      <KiosqueActivationPrompt
        titre="Pointage mobile"
        sousTitre="Saisissez le code personnel fourni par votre administrateur"
        libelleBouton="Activer mon téléphone"
        onJeton={enregistrerJetonAppareilPersonnel}
        onActive={() => setEtatActivation('active')}
      />
    )
  }
  return <EcranPointageMobile />
}

function EcranPointageMobile() {
  const enLigne = useEnLigne()
  const [typeScanEnAttente, setTypeScanEnAttente] = useState<'entree' | 'sortie' | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<PointageReponse | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [historique, setHistorique] = useState<PointageReponse[]>([])

  const chargerHistorique = useCallback(async () => {
    const jetonAppareil = lireJetonAppareilPersonnel()
    if (!jetonAppareil) return
    try {
      setHistorique(await mesPointagesRecents(jetonAppareil))
    } catch {
      // Pas critique : l'historique reste vide, le pointage lui-même n'en dépend pas.
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerHistorique()
  }, [chargerHistorique])

  const executerScan = useCallback(
    async (valeurQrSite: string, typeScan: 'entree' | 'sortie') => {
      const jetonAppareil = lireJetonAppareilPersonnel()
      if (!jetonAppareil) {
        window.location.reload()
        return
      }
      setLoading(true)
      setResultat(null)
      setErreur(null)
      try {
        const pointage = await scannerPersonnel(typeScan, valeurQrSite, jetonAppareil)
        setResultat(pointage)
        jouerBip(true)
        void chargerHistorique()
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string }
        if (apiErr?.status === 401) {
          effacerJetonAppareilPersonnel()
          window.location.reload()
          return
        }
        jouerBip(false)
        void toast.error(apiErr?.message ?? 'Erreur inconnue')
        setErreur(apiErr?.message ?? 'Erreur inconnue')
      } finally {
        setLoading(false)
        setTypeScanEnAttente(null)
      }
    },
    [chargerHistorique],
  )

  const onQrDetecte = useCallback(
    (valeur: string) => {
      if (!typeScanEnAttente || loading) return
      void executerScan(valeur, typeScanEnAttente)
    },
    [typeScanEnAttente, loading, executerScan],
  )

  function preparerScan(typeScan: 'entree' | 'sortie') {
    setTypeScanEnAttente(typeScan)
    setResultat(null)
    setErreur(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4] p-6">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#D8D4CC] bg-white shadow-xl">
        <div className="border-b border-[#D8D4CC] bg-[#1B2A41] px-8 py-6 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#243650]"
            style={{ boxShadow: `0 0 0 1px ${ROSE_MARQUE}33` }}
          >
            <HBLogo size={32} />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[20px] font-semibold text-white"
          >
            Mon pointage
          </h1>
          <p className="mt-1 text-[12px] text-white/60">
            Scannez le QR affiché sur place, après avoir choisi Entrée ou Sortie
          </p>
        </div>

        <div className="space-y-5 p-8">
          {!enLigne && (
            <div className="flex items-center gap-2 rounded-lg border border-[#C87F3A]/30 bg-[#C87F3A]/10 px-3 py-2 text-[12px] text-[#C87F3A]">
              <WifiOff size={14} className="flex-shrink-0" />
              Hors connexion — le pointage ne peut pas être enregistré tant que le réseau n'est pas
              revenu.
            </div>
          )}

          {typeScanEnAttente ? (
            <div className="space-y-3">
              <p className="text-center text-[12px] text-[#6B7280]">
                Présentez le QR du lieu devant la caméra (
                {typeScanEnAttente === 'entree' ? 'Entrée' : 'Sortie'})
              </p>
              <QrScanner
                actif
                onScan={onQrDetecte}
                onErreur={(msg) => {
                  setErreur(msg)
                  setTypeScanEnAttente(null)
                }}
              />
              <button
                onClick={() => setTypeScanEnAttente(null)}
                className="w-full text-center text-[12px] text-[#9CA3AF] hover:text-[#1B2A41]"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <Camera size={20} className="text-[#9CA3AF]" />
              <p className="text-[12px] text-[#9CA3AF]">
                Choisissez Entrée ou Sortie pour activer la caméra
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={loading || typeScanEnAttente === 'entree' || !enLigne}
              onClick={() => preparerScan('entree')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4A7C6B] py-4 text-[14px] font-medium text-white transition-colors hover:bg-[#3d6a5a] disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading && typeScanEnAttente === 'entree' ? '…' : 'Entrée'}
            </button>
            <button
              disabled={loading || typeScanEnAttente === 'sortie' || !enLigne}
              onClick={() => preparerScan('sortie')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C1495A] py-4 text-[14px] font-medium text-white transition-colors hover:bg-[#a83d4b] disabled:opacity-50"
            >
              <LogOut size={16} />
              {loading && typeScanEnAttente === 'sortie' ? '…' : 'Sortie'}
            </button>
          </div>

          {resultat && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/8 px-4 py-5 text-center">
              <CheckCircle2 size={28} className="animate-bounce text-[#4A7C6B]" />
              <p className="text-[14px] font-medium text-[#1B2A41]">
                {resultat.typeScan === 'entree' ? 'Entrée enregistrée' : 'Sortie enregistrée'}
              </p>
              <p style={{ fontFamily: 'var(--font-code)' }} className="text-[12px] text-[#6B7280]">
                {dayjs(resultat.horodatage).format('HH:mm:ss — DD/MM/YYYY')}
              </p>
            </div>
          )}

          {erreur && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/8 px-4 py-5 text-center">
              <XCircle size={28} className="text-[#C1495A]" />
              <p className="text-[14px] font-medium text-[#1B2A41]">Erreur</p>
              <p className="text-[12px] text-[#6B7280]">{erreur}</p>
            </div>
          )}

          {historique.length > 0 && (
            <div className="border-t border-[#D8D4CC] pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-[#9CA3AF] uppercase">
                <History size={12} /> Mes derniers pointages
              </p>
              <ul className="space-y-1.5">
                {historique.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between text-[12px] text-[#1B2A41]"
                  >
                    <span>{p.typeScan === 'entree' ? 'Entrée' : 'Sortie'}</span>
                    <span style={{ fontFamily: 'var(--font-code)' }} className="text-[#6B7280]">
                      {dayjs(p.horodatage).format('DD/MM HH:mm')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
