import { forwardRef, type ReactNode } from 'react'
import QRCode from 'react-qr-code'
import type { Employe } from '@/features/employee/employesApi'
import { useEmployePhotoUrl } from '@/features/employee/useEmployePhoto'

export const BADGE_WIDTH = 1050
export const BADGE_HEIGHT = 650
export const BADGE_RADIUS = 32

const GOLD = '#D4A64A'

type TypeContratBadge = 'CDI' | 'CDD' | 'STAGIAIRE' | 'STAGIAIRE_REMUNERE'

const BADGE_TEMPLATES: Record<TypeContratBadge, string> = {
  CDI: '/assets/badge-template-cdi.png',
  CDD: '/assets/badge-template-cdd.png',
  STAGIAIRE: '/assets/badge-template-stagiaire.png',
  STAGIAIRE_REMUNERE: '/assets/badge-template-stagiaire-remunere.png',
}

function templateSrc(typeContrat?: string | null): string {
  if (typeContrat && typeContrat in BADGE_TEMPLATES) {
    return BADGE_TEMPLATES[typeContrat as TypeContratBadge]
  }
  return BADGE_TEMPLATES.CDI
}

/**
 * Zones calées sur les templates (dimensions réelles 1536×1024), mesurées par détection
 * pixel-par-pixel des bordures dorées du template (script ponctuel, pas commité — cf. session du
 * 2026-07-15). Exprimées en % du conteneur 1050×650 (object-fill étire indépendamment X et Y donc
 * les % restent valides même si l'aspect ratio diffère). Les valeurs précédentes de nom/poste/
 * matricule/departement avaient été mesurées à la main et étaient décalées de 2 à 3 points par
 * rapport aux boîtes réellement imprimées sur le template (texte qui déborde de son encadré doré).
 */
const ZONES = {
  nom: { left: '5.66%', top: '34.38%', width: '40.63%', height: '8.89%' },
  poste: { left: '5.66%', top: '49.41%', width: '40.63%', height: '8.79%' },
  matricule: { left: '15.30%', top: '70.51%', width: '14.97%', height: '5.96%' },
  departement: { left: '42.90%', top: '70.51%', width: '15.04%', height: '5.96%' },
  photo: { left: '73.2%', top: '6.97%', width: '21%', height: '41.30%' },
  // Hauteur étendue jusqu'à ~92% pour que le carton blanc recouvre la légende "Scannez pour
  // vérifier" imprimée sur le template — cachée plutôt que rognée (cf. EmployeeBadge).
  qr: { left: '72.80%', top: '49.41%', width: '22.00%', height: '37.00%' },
} as const

/**
 * Réduit la taille de police si le texte risque de déborder de sa boîte imprimée (ex. un long nom
 * de département) plutôt que de le laisser tronquer en ellipse sans prévenir. Heuristique de
 * largeur moyenne de caractère (police grasse) — approximative mais suffisante pour ce cas d'usage
 * borné (badge imprimable, pas un layout arbitraire).
 */
function fitFontSize(text: string, boxWidthPx: number, baseFontSize: number): number {
  const CHAR_WIDTH_FACTOR = 0.58
  const MIN_FONT_SIZE = baseFontSize * 0.62
  const usableWidth = boxWidthPx * 0.92
  const estimatedWidth = text.length * CHAR_WIDTH_FACTOR * baseFontSize
  if (estimatedWidth <= usableWidth || text.length === 0) return baseFontSize
  return Math.max(MIN_FONT_SIZE, usableWidth / (text.length * CHAR_WIDTH_FACTOR))
}

function titleCase(value: string): string {
  if (!value || value === '—') return '—'
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function OverlayBox({
  zone,
  children,
  className = '',
}: {
  zone: { left: string; top: string; width: string; height: string }
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`absolute z-10 overflow-hidden ${className}`}
      style={{
        left: zone.left,
        top: zone.top,
        width: zone.width,
        height: zone.height,
      }}
    >
      {children}
    </div>
  )
}

export const EmployeeBadge = forwardRef<
  HTMLDivElement,
  {
    employe: Employe
    qrValue?: string | null
    scale?: number
    className?: string
  }
>(function EmployeeBadge({ employe, qrValue, scale = 1, className = '' }, ref) {
  const photoUrl = useEmployePhotoUrl(employe.id, employe.photoFichierId)
  const matricule = employe.id?.substring(0, 8).toUpperCase() ?? '—'
  const departement = titleCase(employe.departementNom ?? '—')
  const nomComplet = `${employe.prenom ?? ''} ${employe.nom ?? ''}`.trim()
  const poste = titleCase(employe.poste ?? 'Employé')
  const template = templateSrc(employe.typeContrat)

  const nameFontSize = BADGE_HEIGHT * 0.075 * 0.68
  const posteFontSize = BADGE_HEIGHT * 0.085 * 0.46
  const valueFontSize = BADGE_HEIGHT * 0.042 * 0.78
  const qrSize = BADGE_WIDTH * parseFloat(ZONES.qr.width) * 0.01 * 0.86
  const photoRadius = BADGE_WIDTH * 0.212 * 0.108

  const matriculeBoxHeightPx = BADGE_HEIGHT * (parseFloat(ZONES.matricule.height) / 100)
  const departementBoxHeightPx = BADGE_HEIGHT * (parseFloat(ZONES.departement.height) / 100)
  const matriculeBoxWidthPx = BADGE_WIDTH * (parseFloat(ZONES.matricule.width) / 100)
  const departementBoxWidthPx = BADGE_WIDTH * (parseFloat(ZONES.departement.width) / 100)
  const matriculeFontSize = fitFontSize(matricule, matriculeBoxWidthPx, valueFontSize)
  const departementFontSize = fitFontSize(departement, departementBoxWidthPx, valueFontSize)

  const scaledW = BADGE_WIDTH * scale
  const scaledH = BADGE_HEIGHT * scale

  return (
    <div className={className} style={{ width: scaledW, height: scaledH, overflow: 'hidden' }}>
      <div
        ref={ref}
        className="group relative overflow-hidden shadow-2xl transition-transform duration-300 ease-out select-none hover:-translate-y-[3px]"
        style={{
          width: BADGE_WIDTH,
          height: BADGE_HEIGHT,
          borderRadius: BADGE_RADIUS,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          fontFamily: 'Inter, system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <img
          src={template}
          alt=""
          aria-hidden
          className="absolute inset-0 z-0 h-full w-full object-fill"
          draggable={false}
        />
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4A7C6B]/30 to-transparent" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B2A41]/80 to-transparent" />

        <OverlayBox zone={ZONES.nom}>
          <div className="flex h-full items-center px-[3%]">
            <p
              className="truncate font-extrabold text-white"
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              {nomComplet}
            </p>
          </div>
        </OverlayBox>

        <OverlayBox zone={ZONES.poste}>
          <div className="flex h-full items-center px-[3%]">
            <p
              className="truncate font-semibold"
              style={{
                fontSize: posteFontSize,
                fontWeight: 600,
                color: GOLD,
                lineHeight: 1.15,
              }}
            >
              {poste}
            </p>
          </div>
        </OverlayBox>

        <OverlayBox zone={ZONES.matricule}>
          <p
            className="truncate px-[4%] text-center font-bold text-white"
            style={{
              fontSize: matriculeFontSize,
              fontWeight: 700,
              lineHeight: `${matriculeBoxHeightPx}px`,
              height: '100%',
              margin: 0,
            }}
          >
            {matricule}
          </p>
        </OverlayBox>

        <OverlayBox zone={ZONES.departement}>
          <p
            className="truncate px-[4%] text-center font-bold text-white"
            style={{
              fontSize: departementFontSize,
              fontWeight: 700,
              lineHeight: `${departementBoxHeightPx}px`,
              height: '100%',
              margin: 0,
            }}
          >
            {departement}
          </p>
        </OverlayBox>

        <OverlayBox
          zone={ZONES.photo}
          className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={nomComplet}
              className="h-full w-full object-cover"
              style={{ borderRadius: photoRadius }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center font-bold text-white/60"
              style={{
                borderRadius: photoRadius,
                background: 'rgba(7,28,52,0.55)',
                fontSize: BADGE_HEIGHT * 0.042 * 1.6,
              }}
            >
              {employe.prenom?.[0]}
              {employe.nom?.[0]}
            </div>
          )}
        </OverlayBox>

        <OverlayBox zone={ZONES.qr}>
          <div className="flex h-full w-full items-center justify-center p-[2%]">
            {qrValue ? (
              <div
                className="flex h-full w-full items-center justify-center bg-white transition-shadow duration-300 ease-out group-hover:shadow-[0_0_16px_rgba(212,166,74,0.28)]"
                style={{
                  borderRadius: qrSize * 0.06,
                  border: `${Math.max(3, qrSize * 0.022)}px solid ${GOLD}`,
                }}
              >
                <QRCode value={qrValue} size={qrSize} level="M" />
              </div>
            ) : (
              <div
                className="flex items-center justify-center text-white/40"
                style={{ fontSize: valueFontSize * 0.85 }}
              >
                N/A
              </div>
            )}
          </div>
        </OverlayBox>
      </div>
    </div>
  )
})
