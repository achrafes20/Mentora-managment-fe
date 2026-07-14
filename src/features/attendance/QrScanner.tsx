import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  actif: boolean
  onScan: (valeur: string) => void
  onErreur?: (msg: string) => void
}

export function QrScanner({ actif, onScan, onErreur }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const zoneId = 'kiosque-qr-reader'

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!actif) return

    const scanner = new Html5Qrcode(zoneId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => onScanRef.current(decoded),
        () => {},
      )
      .catch((err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Impossible d'accéder à la caméra"
        onErreur?.(msg)
      })

    return () => {
      void scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
      scannerRef.current = null
    }
  }, [actif, onErreur])

  if (!actif) return null

  return (
    <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-black">
      <div id={zoneId} className="w-full" />
    </div>
  )
}
