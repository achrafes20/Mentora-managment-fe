export interface MockRequest {
  id: string
  employe: string
  type: 'Congé payé' | 'Bon de sortie' | 'Document'
  statut: 'En attente' | 'Approuvé' | 'Rejeté' | 'À envoyer'
  date: string
  details: string
}

export interface MockCandidate {
  id: string
  nom: string
  prenom: string
  poste: string
  etape: 'Reçu' | 'Présélectionné' | 'Entretien' | 'Décision' | 'Embauché' | 'Rejeté' | 'Archivée'
  score: number | null
  dateDepot: string
  tags: string[]
  analyseEnAttente: boolean
}

export interface MockNotification {
  id: string
  type: 'approbation' | 'candidat' | 'fin_contrat' | 'anomalie' | 'systeme'
  text: string
  time: string
  unread: boolean
  path: string
}

export const MOCK_REQUESTS: MockRequest[] = [
  {
    id: 'r1',
    employe: 'Karim Benali',
    type: 'Congé payé',
    statut: 'En attente',
    date: '28/06/2024',
    details: '5 jours du 15 au 19 juillet 2024',
  },
  {
    id: 'r2',
    employe: 'Sophie Martin',
    type: 'Bon de sortie',
    statut: 'Approuvé',
    date: '27/06/2024',
    details: 'Créneau 14h00–16h30, motif : RDV médical',
  },
  {
    id: 'r3',
    employe: 'Thomas Renard',
    type: 'Congé payé',
    statut: 'Approuvé',
    date: '25/06/2024',
    details: '2 jours du 1 au 2 juillet 2024',
  },
  {
    id: 'r4',
    employe: 'Mehdi Ouali',
    type: 'Document',
    statut: 'À envoyer',
    date: '24/06/2024',
    details: 'Attestation de travail pour dossier bancaire',
  },
]

export const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: 'c1',
    nom: 'Khalil',
    prenom: 'Ahmed',
    poste: 'Développeur Full Stack',
    etape: 'Entretien',
    score: 87,
    dateDepot: '15/06/2024',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    analyseEnAttente: false,
  },
  {
    id: 'c2',
    nom: 'Petitjean',
    prenom: 'Laura',
    poste: 'Chef de Projet Digital',
    etape: 'Décision',
    score: 92,
    dateDepot: '18/06/2024',
    tags: ['Agile', 'Scrum', 'Jira'],
    analyseEnAttente: false,
  },
  {
    id: 'c3',
    nom: 'Mourtada',
    prenom: 'Yassine',
    poste: 'Designer Produit',
    etape: 'Reçu',
    score: null,
    dateDepot: '28/06/2024',
    tags: [],
    analyseEnAttente: true,
  },
  {
    id: 'c4',
    nom: 'Fontaine',
    prenom: 'Clara',
    poste: 'Développeuse Backend',
    etape: 'Présélectionné',
    score: 74,
    dateDepot: '20/06/2024',
    tags: ['Python', 'Django', 'Redis'],
    analyseEnAttente: false,
  },
]

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n1',
    type: 'approbation',
    text: "Congé de Karim Benali en attente d'approbation (5 jours, 15–19 juillet).",
    time: 'il y a 5 min',
    unread: true,
    path: '/demandes',
  },
  {
    id: 'n2',
    type: 'candidat',
    text: 'Nouvelle candidature reçue — Yassine Mourtada (Designer Produit).',
    time: 'il y a 2h',
    unread: true,
    path: '/recrutement',
  },
  {
    id: 'n3',
    type: 'fin_contrat',
    text: 'Fin de contrat dans 5 jours — Nadia Bensalem (Stage).',
    time: 'il y a 3h',
    unread: true,
    path: '/documents',
  },
  {
    id: 'n4',
    type: 'anomalie',
    text: 'Anomalie de pointage — Mehdi Ouali (25/06).',
    time: 'hier',
    unread: false,
    path: '/presence',
  },
]

export const MOCK_AUDIT_LOG = [
  {
    datetime: '01/07/2024 08:47',
    user: 'Amal Medah',
    action: 'Connexion',
    module: 'Système',
    element: '—',
    detail: 'Connexion depuis 192.168.1.1',
  },
  {
    datetime: '28/06/2024 15:12',
    user: 'Amal Medah',
    action: 'Approbation',
    module: 'Demande administrative',
    element: 'Bon de sortie — Sophie Martin',
    detail: 'Approuvé',
  },
  {
    datetime: '27/06/2024 11:05',
    user: 'Sophie Martin (en délégation)',
    action: 'Approbation',
    module: 'Demande administrative',
    element: 'Congé payé — Thomas Renard',
    detail: 'Approuvé — 2 jours',
  },
]

export const DEPT_BREAKDOWN = [
  { dept: 'Technologie', abbr: 'IT', count: 18 },
  { dept: 'Marketing', abbr: 'MKT', count: 12 },
  { dept: 'Ventes', abbr: 'VTE', count: 9 },
  { dept: 'Finance', abbr: 'FIN', count: 8 },
]
