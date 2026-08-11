import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import templateUrl from '@/assets/qr-site-template.png'
import type { SiteQrCodeReponse } from './api'

// Coordonnées estimées visuellement dans le gabarit (1054×1492 px) — cadre QR vide, à ajuster si
// le gabarit change. Le libellé de lieu ("Siège Tétouan") est déjà imprimé dans le gabarit lui-
// même : rien à superposer par-dessus.
const TAILLE_TEMPLATE = { width: 1054, height: 1492 }
const CADRE_QR = { x: 258, y: 585, taille: 534 }
const COULEUR_MARINE = '#1B2A41'

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function composerCanvas(site: SiteQrCodeReponse): Promise<HTMLCanvasElement> {
  const [template, qrDataUrl] = await Promise.all([
    chargerImage(templateUrl),
    QRCode.toDataURL(site.valeur, {
      margin: 0,
      width: CADRE_QR.taille,
      color: { dark: COULEUR_MARINE, light: '#FFFFFF' },
    }),
  ])
  const qrImg = await chargerImage(qrDataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = TAILLE_TEMPLATE.width
  canvas.height = TAILLE_TEMPLATE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté')

  ctx.drawImage(template, 0, 0, TAILLE_TEMPLATE.width, TAILLE_TEMPLATE.height)
  ctx.drawImage(qrImg, CADRE_QR.x, CADRE_QR.y, CADRE_QR.taille, CADRE_QR.taille)

  return canvas
}

// PDF A4 portrait, image centrée en conservant les proportions du gabarit — utilisé aussi bien
// pour le téléchargement que pour l'aperçu (le PDF, pas juste l'image, doit être ce qui s'ouvre).
async function composerPdf(site: SiteQrCodeReponse): Promise<jsPDF> {
  const canvas = await composerCanvas(site)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const ratio = TAILLE_TEMPLATE.width / TAILLE_TEMPLATE.height
  let imgWidth = pageWidth
  let imgHeight = imgWidth / ratio
  if (imgHeight > pageHeight) {
    imgHeight = pageHeight
    imgWidth = imgHeight * ratio
  }
  const x = (pageWidth - imgWidth) / 2
  const y = (pageHeight - imgHeight) / 2
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight)
  return pdf
}

export async function telechargerPosterSite(
  site: SiteQrCodeReponse,
  format: 'png' | 'pdf',
): Promise<void> {
  const nomFichier = `qr-site-${site.libelle.replace(/\s+/g, '-').toLowerCase()}`

  if (format === 'png') {
    const canvas = await composerCanvas(site)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${nomFichier}.png`
    a.click()
    return
  }

  const pdf = await composerPdf(site)
  pdf.save(`${nomFichier}.pdf`)
}

export async function apercuPosterSite(site: SiteQrCodeReponse): Promise<void> {
  const pdf = await composerPdf(site)
  const url = pdf.output('bloburl') as unknown as string
  window.open(url, '_blank', 'noreferrer')
}
