import type { ThemeConfig } from 'antd'

// Système de design HB Développement (palette, typographie, radius).
// Source : theme.css / rh-entreprise-design.md du design Figma.
// Rose Marque (identité de marque — logo, login, indicateur nav actif)
// est volontairement EXCLU d'ici : ce n'est jamais un token sémantique
// AntD (action/statut), voir --rose-marque* dans src/styles/global.css.
export const hbTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1B2A41', // Encre Marine — actions
    colorSuccess: '#4A7C6B', // Sauge Administrative — actif / approuvé / embauché
    colorWarning: '#C87F3A', // Ambre Vigilance — en attente / à traiter
    colorError: '#C1495A', // Corail Alerte — anomalie / rejeté / bloqué
    colorBorder: '#D8D4CC', // Gris Dossier
    colorBgLayout: '#F7F7F4', // Blanc Papier
    colorBgContainer: '#ffffff',
    colorTextBase: '#1B2A41',
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
}
