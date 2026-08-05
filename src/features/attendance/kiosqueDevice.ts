const CLE_JETON_APPAREIL = 'hb_kiosque_device_token'

/** NFR-UX-02 : jeton d'appareil kiosque — persiste jusqu'à révocation manuelle (pas d'expiration). */
export function lireJetonAppareil(): string | null {
  return localStorage.getItem(CLE_JETON_APPAREIL)
}

export function enregistrerJetonAppareil(jeton: string): void {
  localStorage.setItem(CLE_JETON_APPAREIL, jeton)
}

export function effacerJetonAppareil(): void {
  localStorage.removeItem(CLE_JETON_APPAREIL)
}
