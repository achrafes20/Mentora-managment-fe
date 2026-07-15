import { toast } from '@/components/ui/toast'
import { Camera, CheckCircle2, Keyboard, LogIn, LogOut, XCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'
import { QrScanner } from './QrScanner'
import { scannerKiosque, type PointageReponse } from './api'

type ModeSaisie = 'camera' | 'manuel'

/**
 * Page Kiosque publique — accessible sans authentification (EF-ATT-02).
 * Scan caméra ou saisie manuelle du QR code.
 */
export function KiosquePage() {
  const [mode, setMode] = useState<ModeSaisie>('camera')
  const [valeurQr, setValeurQr] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<PointageReponse | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [typeScanEnAttente, setTypeScanEnAttente] = useState<'entree' | 'sortie' | null>(null)

  const executerScan = useCallback(async (valeur: string, typeScan: 'entree' | 'sortie') => {
    if (!valeur.trim()) {
      void toast.warning('Veuillez scanner ou saisir un QR code')
      return
    }
    setLoading(true)
    setResultat(null)
    setErreur(null)
    try {
      const pointage = await scannerKiosque(valeur.trim(), typeScan)
      setResultat(pointage)
      setValeurQr('')
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      setErreur(apiErr?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
      setTypeScanEnAttente(null)
    }
  }, [])

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
    if (mode === 'manuel') {
      void executerScan(valeurQr, typeScan)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4] p-6">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#D8D4CC] bg-white shadow-xl">
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
            Kiosque de pointage
          </h1>
          <p className="mt-1 text-[12px] text-white/60">
            Scannez votre QR code puis appuyez sur Entrée ou Sortie
          </p>
        </div>

        <div className="space-y-5 p-8">
          <div className="flex rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-1">
            <button
              onClick={() => setMode('camera')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-medium transition-colors ${
                mode === 'camera'
                  ? 'bg-[#1B2A41] text-white'
                  : 'text-[#6B7280] hover:text-[#1B2A41]'
              }`}
            >
              <Camera size={14} /> Scanner
            </button>
            <button
              onClick={() => setMode('manuel')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-medium transition-colors ${
                mode === 'manuel'
                  ? 'bg-[#1B2A41] text-white'
                  : 'text-[#6B7280] hover:text-[#1B2A41]'
              }`}
            >
              <Keyboard size={14} /> Saisie manuelle
            </button>
          </div>

          {mode === 'camera' ? (
            <div className="space-y-3">
              {typeScanEnAttente ? (
                <>
                  <p className="text-center text-[12px] text-[#6B7280]">
                    Présentez votre QR code devant la caméra (
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
                </>
              ) : (
                <p className="py-4 text-center text-[12px] text-[#9CA3AF]">
                  Choisissez Entrée ou Sortie pour activer la caméra
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={valeurQr}
              onChange={(e) => {
                setValeurQr(e.target.value)
                setResultat(null)
                setErreur(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && valeurQr.trim()) void executerScan(valeurQr, 'entree')
              }}
              placeholder="Valeur du QR code…"
              autoFocus
              style={{ fontFamily: 'var(--font-code)' }}
              className="w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-4 py-3 text-center text-[15px] tracking-widest text-[#1B2A41] placeholder:text-[#9CA3AF] focus:border-[#1B2A41] focus:outline-none"
            />
          )}

          <div className="flex gap-3">
            <button
              disabled={loading || (mode === 'camera' && typeScanEnAttente === 'entree')}
              onClick={() => preparerScan('entree')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4A7C6B] py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3d6a5a] disabled:opacity-50"
            >
              <LogIn size={15} />
              {loading && typeScanEnAttente === 'entree' ? '…' : 'Entrée'}
            </button>
            <button
              disabled={loading || (mode === 'camera' && typeScanEnAttente === 'sortie')}
              onClick={() => preparerScan('sortie')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C1495A] py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#a83d4b] disabled:opacity-50"
            >
              <LogOut size={15} />
              {loading && typeScanEnAttente === 'sortie' ? '…' : 'Sortie'}
            </button>
          </div>

          {resultat && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#4A7C6B]/20 bg-[#4A7C6B]/8 px-4 py-5 text-center">
              <CheckCircle2 size={28} className="text-[#4A7C6B]" />
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
        </div>
      </div>
    </div>
  )
}
