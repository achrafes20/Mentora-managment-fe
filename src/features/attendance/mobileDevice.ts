const CLE_JETON_APPAREIL_PERSONNEL = 'hb_pointage_mobile_device_token'

export function lireJetonAppareilPersonnel(): string | null {
  return localStorage.getItem(CLE_JETON_APPAREIL_PERSONNEL)
}

export function enregistrerJetonAppareilPersonnel(jeton: string): void {
  localStorage.setItem(CLE_JETON_APPAREIL_PERSONNEL, jeton)
}

export function effacerJetonAppareilPersonnel(): void {
  localStorage.removeItem(CLE_JETON_APPAREIL_PERSONNEL)
}
