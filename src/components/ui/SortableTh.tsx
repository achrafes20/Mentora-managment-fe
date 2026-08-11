import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

export type Direction = 'asc' | 'desc'

export interface Tri {
  champ: string
  direction: Direction
}

/** Bascule le tri sur `champ` : asc si nouvelle colonne, sinon inverse la direction actuelle. */
export function basculerTri(tri: Tri, champ: string): Tri {
  if (tri.champ !== champ) return { champ, direction: 'asc' }
  return { champ, direction: tri.direction === 'asc' ? 'desc' : 'asc' }
}

export function SortableTh({
  label,
  champ,
  tri,
  onChange,
  className,
}: {
  label: string
  champ: string
  tri: Tri
  onChange: (champ: string) => void
  className?: string
}) {
  const actif = tri.champ === champ
  return (
    <th
      className={`px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => onChange(champ)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-[#1B2A41] ${
          actif ? 'text-[#1B2A41]' : ''
        }`}
      >
        {label}
        {actif ? (
          tri.direction === 'asc' ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  )
}
