import { useEffect, useRef, useId, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ImageUp, RefreshCw } from 'lucide-react'
import jsQR from 'jsqr'

interface SharedProps {
  onScan: (valeur: string) => void
  onErreur?: (msg: string) => void
}

interface CameraProps extends SharedProps {
  actif: boolean
}

export function QrScannerCamera({ actif, onScan, onErreur }: CameraProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const onErreurRef = useRef(onErreur)
  const zoneId = 'kiosque-qr-reader'

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    onErreurRef.current = onErreur
  }, [onErreur])

  useEffect(() => {
    if (!actif) return
    const scanner = new Html5Qrcode(zoneId)
    scannerRef.current = scanner
    const demarrage = scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const taille = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7)
          return { width: taille, height: taille }
        },
      },
      (decoded) => onScanRef.current(decoded),
      () => {},
    )
    demarrage.catch((err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'acceder a la camera"
      onErreurRef.current?.(msg)
    })
    return () => {
      demarrage.then(() => scanner.stop().then(() => scanner.clear())).catch(() => {})
      scannerRef.current = null
    }
  }, [actif])

  if (!actif) return null

  return (
    <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-black">
      <div
        id={zoneId}
        className="aspect-square w-full [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover"
      />
    </div>
  )
}

function extraireQrImage(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(fichier)
    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas indisponible'))
        return
      }

      ctx.drawImage(img, 0, 0, img.width, img.height)

      const imageData = ctx.getImageData(0, 0, img.width, img.height)

      // jsQR est tres robuste pour les images statiques, meme colorees
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code) {
        resolve(code.data)
      } else {
        reject(new Error('QR non trouve par jsQR'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Chargement image echoue'))
    }
    img.src = url
  })
}

type EtatUpload = 'idle' | 'lecture' | 'succes' | 'erreur'

export function QrScannerUpload({ onScan, onErreur }: SharedProps) {
  const inputId = useId()
  const [etat, setEtat] = useState<EtatUpload>('idle')
  const [apercu, setApercu] = useState<string | null>(null)
  const [msgErreur, setMsgErreur] = useState<string | null>(null)

  async function traiterFichier(fichier: File) {
    const url = URL.createObjectURL(fichier)
    setApercu(url)
    setEtat('lecture')
    setMsgErreur(null)

    // Delai pour laisser l'UI reagir
    await new Promise((resolve) => setTimeout(resolve, 50))

    try {
      // On utilise jsQR pour l'upload d'image : c'est l'outil parfait pour les photos statiques
      const decoded = await extraireQrImage(fichier)
      setEtat('succes')
      onScan(decoded)
    } catch {
      // Fallback sur html5-qrcode en cas de probleme avec jsQR (tres rare)
      try {
        const decoded = await Html5Qrcode.scanFile(fichier, false)
        setEtat('succes')
        onScan(decoded)
      } catch {
        setEtat('erreur')
        const msg = 'Impossible de lire le QR code. Essayez une image de meilleure qualite.'
        setMsgErreur(msg)
        onErreur?.(msg)
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  function reinitialiser() {
    setEtat('idle')
    setApercu(null)
    setMsgErreur(null)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {apercu && etat !== 'idle' ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-[#D8D4CC]">
          <img
            src={apercu}
            alt="Photo QR choisie"
            className="aspect-square w-full bg-[#F7F7F4] object-contain"
          />
          {etat === 'lecture' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="animate-pulse text-[13px] font-medium text-white">
                Analyse en cours...
              </span>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#D8D4CC] bg-[#F7F7F4] transition-colors hover:border-[#1B2A41] hover:bg-white"
        >
          <ImageUp size={32} className="text-[#9CA3AF]" />
          <span className="text-[13px] font-medium text-[#6B7280]">
            Choisir une photo du QR code
          </span>
          <span className="text-[11px] text-[#9CA3AF]">JPG, PNG, WEBP...</span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const fichier = e.target.files?.[0]
          if (fichier) void traiterFichier(fichier)
          e.target.value = ''
        }}
      />
      {etat === 'erreur' && msgErreur && (
        <p className="text-center text-[12px] text-[#C1495A]">{msgErreur}</p>
      )}
      {(etat === 'erreur' || etat === 'succes') && (
        <button
          onClick={reinitialiser}
          className="flex items-center gap-1.5 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
        >
          <RefreshCw size={13} /> Choisir une autre photo
        </button>
      )}
    </div>
  )
}

export { QrScannerCamera as QrScanner }
