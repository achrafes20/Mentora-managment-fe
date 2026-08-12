import { useEffect, useState } from 'react'

/**
 * Décompte dérivé d'une échéance serveur (ms epoch) et de l'horloge locale — jamais re-demandé au
 * serveur. Partagé entre le verrouillage kiosque (NFR-UX-02) et le verrouillage de compte (EF-AUTH-03).
 */
export function useCompteARebours(jusquA: number | null) {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    if (jusquA === null) return
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [jusquA])

  const secondesRestantes =
    jusquA !== null ? Math.max(0, Math.ceil((jusquA - maintenant) / 1000)) : 0
  const enCours = jusquA !== null && secondesRestantes > 0

  return { secondesRestantes, enCours }
}

export function formatDecompte(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
