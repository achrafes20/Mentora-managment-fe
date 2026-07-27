/**
 * Déclenche l'enregistrement d'un Blob déjà téléchargé via apiClient (jamais un lien direct :
 * l'intercepteur Authorization ne porte pas sur une navigation <a href> brute, cf. employesApi.ts
 * `ouvrirDocument`). Combine le fetch-en-Blob déjà utilisé ailleurs avec le déclenchement
 * "save-as" déjà utilisé pour la carte employé (carteUtils.ts).
 */
export function declencherTelechargement(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
