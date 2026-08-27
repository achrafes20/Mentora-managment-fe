import { useState } from 'react'
import { Search, X } from 'lucide-react'

export interface PersonneOption {
  id?: string
  nom?: string
  prenom?: string
  email?: string
}

export function libellePersonne(p: PersonneOption): string {
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || p.email || 'Sans nom'
}

/**
 * Typeahead local (tape un nom, la liste déjà chargée se filtre) — remplace un `<Select>` à liste
 * déroulante scrollable pour toute liste de personnes (employés, managers, utilisateurs) : plus
 * rapide à utiliser dès que la liste dépasse une dizaine d'entrées. Même composant que
 * `EmployeSearch` de DemandesPage, extrait ici pour être réutilisable partout dans l'app.
 */
export function PersonSearch({
  label = 'Employé',
  placeholder = 'Rechercher…',
  personnes,
  value,
  onChange,
  required,
  error,
}: {
  label?: string
  placeholder?: string
  personnes: PersonneOption[]
  value: string
  onChange: (id: string) => void
  required?: boolean
  error?: string
}) {
  const selectionne = personnes.find((p) => p.id === value)
  const [query, setQuery] = useState('')
  const [ouvert, setOuvert] = useState(false)

  const resultats = personnes
    .filter((p) => p.id)
    .filter((p) => libellePersonne(p).toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="relative">
      {label && (
        <label className="mb-1.5 block text-[12px] font-medium text-[#1B2A41]">
          {label}
          {required && <span className="text-[#C1495A]"> *</span>}
        </label>
      )}
      <div className="relative">
        <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={ouvert ? query : selectionne ? libellePersonne(selectionne) : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOuvert(true)
            if (value) onChange('')
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          placeholder={placeholder}
          className={`h-9 w-full rounded-lg border border-[#D8D4CC] bg-white pl-8 text-[13px] text-[#1B2A41] outline-none focus:border-[#1B2A41] ${
            selectionne ? 'pr-8' : 'pr-3'
          }`}
        />
        {selectionne && (
          <button
            type="button"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              onChange('')
              setQuery('')
            }}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1B2A41]"
            aria-label="Effacer la sélection"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {ouvert && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-[#D8D4CC] bg-white shadow-lg">
          {resultats.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-[#9CA3AF]">Aucun résultat</p>
          )}
          {resultats.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onChange(p.id as string)
                setQuery('')
                setOuvert(false)
              }}
              className="block w-full px-3 py-2 text-left text-[13px] text-[#1B2A41] hover:bg-[#F7F7F4]"
            >
              {libellePersonne(p)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-[11px] text-[#C1495A]">{error}</p>}
    </div>
  )
}
