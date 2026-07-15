import { toPng } from 'html-to-image'

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

/**
 * `cloneNode(true)` copie l'attribut `src` mais pas l'état de chargement de l'image — un <img>
 * fraîchement cloné n'est pas garanti "decoded" au moment où html-to-image capture le DOM.
 */
async function attendreChargementImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      try {
        await img.decode()
      } catch {
        // Image cassée ou navigateur sans support de decode() — on continue quand même.
      }
    }),
  )
}

export async function telechargerCarteEmploye(
  element: HTMLElement,
  nomFichier: string,
): Promise<void> {
  // Cloner puis insérer comme frère du nœud réel (même contexte d'ancêtres React/CSS) plutôt que
  // de rattacher directement à document.body. Vérifié en session (2026-07-15) : un nœud rattaché
  // directement à document.body — même repositionné hors-écran, même sans aucune classe Tailwind,
  // même un simple <div> trivial — capture systématiquement vide (seul le `backgroundColor` de
  // secours de toPng, aucun contenu) dans cet environnement. Rester dans l'arbre réel de l'appli
  // (ici : juste à côté du badge visible) suffit à corriger le problème.
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.transform = 'none' // annule l'échelle de la miniature affichée à l'écran

  const wrapper = document.createElement('div')
  wrapper.style.width = '0'
  wrapper.style.height = '0'
  wrapper.style.overflow = 'hidden'
  wrapper.appendChild(clone)
  element.parentElement?.appendChild(wrapper)

  try {
    await inlineBlobImages(clone)
    await attendreChargementImages(clone)

    const dataUrl = await toPng(clone, {
      backgroundColor: '#071C34',
      pixelRatio: 2,
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
    wrapper.remove()
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
