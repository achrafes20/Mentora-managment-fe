import { toPng } from 'html-to-image'
import { BADGE_HEIGHT, BADGE_WIDTH } from '@/components/ui/EmployeeBadge'

/**
 * html-to-image utilise SVG <foreignObject> sous le capot.
 * Les navigateurs bloquent l'affichage des URLs de type "blob:" dans les SVG.
 * On convertit donc les blobs (comme la photo de profil) en Base64.
 */
async function inlineBlobImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img')
  for (const img of images) {
    if (!img.src.startsWith('blob:')) continue
    try {
      const response = await fetch(img.src)
      const blob = await response.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      img.src = dataUrl // on remplace en live par le Base64
    } catch {
      // Ignorer si la conversion échoue
    }
  }
}

export async function telechargerCarteEmploye(
  element: HTMLElement,
  nomFichier: string,
): Promise<void> {
  // Créer un clone hors écran pour ne pas perturber l'interface utilisateur
  const clone = element.cloneNode(true) as HTMLElement

  // Appliquer les dimensions complètes et annuler l'échelle de la miniature
  clone.style.transform = 'none'
  clone.style.position = 'fixed'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  clone.style.width = `${BADGE_WIDTH}px`
  clone.style.height = `${BADGE_HEIGHT}px`

  // Il est impératif d'attacher le clone au DOM pour que html-to-image puisse calculer ses styles
  document.body.appendChild(clone)

  try {
    // 1. Convertir les blobs en base64 sur le clone pour que html-to-image ne crashe pas (erreur [object Event])
    await inlineBlobImages(clone)

    // Petite pause pour s'assurer que le clone est bien rendu par le navigateur
    await new Promise((resolve) => setTimeout(resolve, 100))

    const dataUrl = await toPng(clone, {
      backgroundColor: '#071C34',
      pixelRatio: 2,
      width: BADGE_WIDTH,
      height: BADGE_HEIGHT,
      cacheBust: true,
      skipFonts: false,
    })

    const lien = document.createElement('a')
    lien.download = `${nomFichier}.png`
    lien.href = dataUrl
    document.body.appendChild(lien)
    lien.click()
    document.body.removeChild(lien)
  } catch (err) {
    console.error('Erreur toPng', err)
    throw err
  } finally {
    // Nettoyer le clone
    if (clone.parentNode) {
      document.body.removeChild(clone)
    }
  }
}

export function corpsEmailCarteDefaut(prenom: string, nom: string): string {
  return `Bonjour ${prenom} ${nom},

Veuillez trouver ci-joint votre carte employé HB Development.

Cette carte contient votre QR code de pointage. Présentez-la au kiosque à l'entrée et à la sortie.

Cordialement,
Service RH — HB Development`
}

export function objetEmailCarteDefaut(prenom: string, nom: string): string {
  return `Votre carte employé — ${prenom} ${nom}`
}
