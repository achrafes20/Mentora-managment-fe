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

const SUCCESS_SET = new Set([
  'Actif',
  'actif',
  'Approuvé',
  'Embauché',
  "À l'heure",
  'Valide',
  'Créée',
  'Mise à jour',
  'Réel',
  'Active',
  'Entrée',
  'Résolue',
])
const WARNING_SET = new Set([
  'En attente',
  'À envoyer',
  'Retard',
  'Départ anticipé',
  'Absence',
  'Absence de check-out',
  'Présélectionné',
  'Entretien',
  'Décision',
  'Archivée',
  'Avertissement',
  'Aucun changement',
  'Simulation',
  'Suggestion de réactivation',
  'Sortie',
  'Non résolue',
  'Expiré',
])
const DANGER_SET = new Set(['Rejeté', 'Inactif', 'inactif', 'Erreur', 'Révoquée', 'Absence totale'])

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
    // EF-EMP-07 — import : statut/action de ligne, mode de lot.
    VALIDE: 'Valide',
    AVERTISSEMENT: 'Avertissement',
    ERREUR: 'Erreur',
    CREATION: 'Créée',
    MISE_A_JOUR: 'Mise à jour',
    AUCUN_CHANGEMENT: 'Aucun changement',
    IGNOREE: 'Ignorée',
    SIMULATION: 'Simulation',
    REEL: 'Réel',
    // EF-REC-07/11/12 — pipeline de recrutement (statut_candidature / statut_offre_emploi).
    recu: 'Reçu',
    preselectionne: 'Présélectionné',
    entretien: 'Entretien',
    decision: 'Décision',
    embauche: 'Embauché',
    rejete: 'Rejeté',
    en_attente: 'En attente',
    suggestion_reactivation: 'Suggestion de réactivation',
    archivee: 'Archivée',
    non_traite: 'Non traité',
    ouverte: 'Ouverte',
    fermee: 'Fermée',
    // EF-REC-09 — résultat d'entretien.
    favorable: 'Favorable',
    defavorable: 'Défavorable',
    // EF-AUTH-11→15 — délégation d'approbation (statut_delegation).
    active: 'Active',
    revoquee: 'Révoquée',
    expiree: 'Expirée',
  }
  return map[statut] ?? statut
}
