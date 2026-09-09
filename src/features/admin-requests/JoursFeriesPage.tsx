import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/ui/StatCard'
import type { ApiError } from '@/lib/apiClient'
import { creerJourFerie, listerJoursFeries, supprimerJourFerie } from './adminRequestsApi'

function dateJour() {
  return new Date().toISOString().slice(0, 10)
}

// Wrapper local (pas @/components/ui/Input, qui est un <input> brut sans label ni onChange
// string) — même définition que l'ex-Input local de DemandesPage.tsx, dont cet écran est extrait.
function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[#1B2A41]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      />
    </label>
  )
}

// EF-ADM-12 : gestion réservée Admin, jamais délégable — page dédiée (comme le Journal d'audit),
// accessible uniquement depuis Configuration & Paramétrage, plus mêlée aux onglets de
// Demandes/approbation (qui restent, eux, accessibles à un délégué actif).
export function JoursFeriesPage() {
  const queryClient = useQueryClient()
  const [erreur, setErreur] = useState<string | null>(null)
  const [ferie, setFerie] = useState({ dateFerie: dateJour(), libelle: '' })

  const joursFeriesQuery = useQuery({
    queryKey: ['jours-feries'],
    queryFn: listerJoursFeries,
  })

  const invalider = () => queryClient.invalidateQueries({ queryKey: ['jours-feries'] })

  const ferieMutation = useMutation({
    mutationFn: creerJourFerie,
    onSuccess: async () => {
      setFerie({ dateFerie: dateJour(), libelle: '' })
      setErreur(null)
      await invalider()
    },
    onError: (e: ApiError) => setErreur(e.message),
  })

  const supprimerFerieMutation = useMutation({
    mutationFn: supprimerJourFerie,
    onSuccess: invalider,
    onError: (e: ApiError) => setErreur(e.message),
  })

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Jours fériés" subtitle="Calendrier annuel — Admin uniquement" />

      {erreur && (
        <div className="mb-4 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[12px] text-[#C1495A]">
          {erreur}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
          {(joursFeriesQuery.data ?? []).map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between border-b border-[#D8D4CC]/60 px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <CalendarDays size={16} className="text-[#4A7C6B]" />
                <div>
                  <p className="text-[13px] font-medium text-[#1B2A41]">{j.libelle}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{j.dateFerie}</p>
                </div>
              </div>
              <button
                onClick={() => supprimerFerieMutation.mutate(j.id)}
                className="text-[12px] text-[#C1495A]"
              >
                Supprimer
              </button>
            </div>
          ))}
          {joursFeriesQuery.data?.length === 0 && (
            <p className="p-4 text-[12px] text-[#9CA3AF]">Aucun jour férié enregistré.</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ferieMutation.mutate(ferie)
          }}
          className="space-y-4 rounded-xl border border-[#D8D4CC] bg-white p-5"
        >
          <Input
            label="Date"
            type="date"
            value={ferie.dateFerie}
            onChange={(v) => setFerie((f) => ({ ...f, dateFerie: v }))}
          />
          <Input
            label="Libellé"
            value={ferie.libelle}
            onChange={(v) => setFerie((f) => ({ ...f, libelle: v }))}
          />
          <button
            disabled={!ferie.dateFerie || !ferie.libelle || ferieMutation.isPending}
            className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
          >
            Ajouter / mettre à jour
          </button>
          <p className="text-[11px] text-[#6B7280]">
            Les fêtes hégiriennes se saisissent manuellement chaque année.
          </p>
        </form>
      </section>
    </div>
  )
}
