import { useMemo, useState } from 'react'
import { basculerTri, type Tri } from './SortableTh'

/**
 * Tri client d'un tableau déjà chargé en mémoire (par opposition au tri serveur via `sort` sur
 * une liste paginée). `valeur(item, champ)` extrait la valeur comparable pour un champ donné.
 */
export function useTriLocal<T>(
  items: T[] | undefined,
  valeur: (item: T, champ: string) => string | number | boolean | null | undefined,
  triInitial: Tri,
) {
  const [tri, setTri] = useState<Tri>(triInitial)

  const trie = useMemo(() => {
    if (!items) return []
    const copie = [...items]
    copie.sort((a, b) => {
      const va = valeur(a, tri.champ)
      const vb = valeur(b, tri.champ)
      if (va == null && vb == null) return 0
      if (va == null) return tri.direction === 'asc' ? -1 : 1
      if (vb == null) return tri.direction === 'asc' ? 1 : -1
      let cmp = 0
      if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb)
      else cmp = va < vb ? -1 : va > vb ? 1 : 0
      return tri.direction === 'asc' ? cmp : -cmp
    })
    return copie
  }, [items, tri, valeur])

  function handleTri(champ: string) {
    setTri((t) => basculerTri(t, champ))
  }

  return { trie, tri, handleTri }
}
