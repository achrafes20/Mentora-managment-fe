export const ROSE_MARQUE = '#C92B6A'
export const ROSE_MARQUE_UI = '#A8245A'

export const COLORS = {
  paper: '#F7F7F4',
  ink: '#1B2A41',
  sage: '#4A7C6B',
  amber: '#C87F3A',
  coral: '#C1495A',
  gray: '#D8D4CC',
  muted: '#6B7280',
  faint: '#9CA3AF',
} as const

export type TagVariant = 'success' | 'warning' | 'danger' | 'neutral'

const SUCCESS_SET = new Set(['Actif', 'actif', 'Approuvé', 'Embauché', "À l'heure"])
const WARNING_SET = new Set([
  'En attente',
  'À envoyer',
  'Retard',
  'Départ anticipé',
  'Absence',
  'Présence incomplète',
  'Absence de check-out',
  'Présélectionné',
  'Entretien',
  'Décision',
  'Archivée',
])
const DANGER_SET = new Set(['Rejeté', 'Inactif', 'inactif', 'Rejeté'])

export function tagVariant(statut: string): TagVariant {
  if (SUCCESS_SET.has(statut)) return 'success'
  if (WARNING_SET.has(statut)) return 'warning'
  if (DANGER_SET.has(statut)) return 'danger'
  return 'neutral'
}

export const TAG_STYLES: Record<TagVariant, { wrap: string; dot: string }> = {
  success: { wrap: 'bg-[#4A7C6B]/10 text-[#4A7C6B]', dot: 'bg-[#4A7C6B]' },
  warning: { wrap: 'bg-[#C87F3A]/10 text-[#C87F3A]', dot: 'bg-[#C87F3A]' },
  danger: { wrap: 'bg-[#C1495A]/10 text-[#C1495A]', dot: 'bg-[#C1495A]' },
  neutral: { wrap: 'bg-[#D8D4CC]/60 text-[#6B7280]', dot: 'bg-[#9CA3AF]' },
}

export function formatStatut(statut: string): string {
  const map: Record<string, string> = {
    actif: 'Actif',
    inactif: 'Inactif',
    CDI: 'CDI',
    CDD: 'CDD',
    STAGIAIRE: 'Stage',
    STAGIAIRE_REMUNERE: 'Stage rémunéré',
  }
  return map[statut] ?? statut
}
