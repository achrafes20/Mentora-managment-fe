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
        // Fonction plutôt qu'une taille fixe en pixels : le cadre reste cohérent avec la taille
        // réelle du flux affiché (~70% du plus petit côté), au lieu de déborder ou de paraître
        // minuscule selon la résolution de la caméra.
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const taille = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7)
          return { width: taille, height: taille }
        },
      },
      (decoded) => onScanRef.current(decoded),
      () => {},
    )

    demarrage.catch((err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'accéder à la caméra"
      onErreurRef.current?.(msg)
    })

    return () => {
      // Attendre la résolution de start() (succès ou échec) avant de stopper, plutôt qu'un
      // stop() immédiat : si le nettoyage tombe pendant que start() attend encore la permission
      // caméra (StrictMode en dev, qui monte -> nettoie -> remonte à chaque composant), stopper
      // tout de suite ne faisait rien puisque le scanner n'était pas encore "démarré" du point de
      // vue de la librairie — son flux vidéo continuait alors d'être injecté dans le DOM une fois
      // la permission accordée, jamais arrêté : deux <video> se superposaient dans le même
      // conteneur (l'un fantôme du premier montage, l'autre du remontage réel), d'où la caméra qui
      // semblait "se diviser en deux".
      demarrage.then(() => scanner.stop().then(() => scanner.clear())).catch(() => {})
      scannerRef.current = null
    }
    // `onErreur` est lu via une ref (comme `onScan`) : un changement de référence côté parent (ex.
    // fonction inline recréée à chaque rendu) ne doit jamais redémarrer la caméra.
  }, [actif])

  if (!actif) return null

  return (
    // Taille figée (aspect-square) plutôt que dépendre de la hauteur intrinsèque de la vidéo :
    // html5-qrcode fixe la largeur de <video> en pixels d'après `clientWidth` du conteneur au
    // moment du montage — un conteneur déjà dimensionné évite un flash à largeur nulle.
    // [&_video] force la vidéo injectée par la librairie à remplir ce cadre (elle ne pose par
    // défaut qu'un style inline `width`, jamais `height`/`object-fit`) — c'est ce qui donne
    // l'aperçu caméra en direct demandé, pas seulement le rectangle de détection.
    <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-black">
      <div
        id={zoneId}
        className="aspect-square w-full [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover"
      />
    </div>
  )
}
