import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/toast'
import type { ApiError } from '@/lib/apiClient'
import {
  chargerLogoEntreprise,
  modifierIdentiteEntreprise,
  obtenirIdentiteEntreprise,
  televerserLogoEntreprise,
  type IdentiteEntreprise,
} from './identiteEntrepriseApi'

const CLE_IDENTITE = ['identite-entreprise'] as const

function IdentiteEntrepriseForm({ identite }: { identite: IdentiteEntreprise }) {
  const queryClient = useQueryClient()
  const { data: logoUrl } = useQuery({
    queryKey: [...CLE_IDENTITE, 'logo', identite.logoFichierId],
    queryFn: chargerLogoEntreprise,
    enabled: !!identite.logoFichierId,
  })

  const [raisonSociale, setRaisonSociale] = useState(identite.raisonSociale ?? '')
  const [adresse, setAdresse] = useState(identite.adresse ?? '')
  const [telephone, setTelephone] = useState(identite.telephone ?? '')
  const [email, setEmail] = useState(identite.email ?? '')

  const enregistrer = useMutation({
    mutationFn: () => modifierIdentiteEntreprise({ raisonSociale, adresse, telephone, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_IDENTITE })
      toast.success("Identité de l'entreprise mise à jour.")
    },
    onError: (err: ApiError) => toast.error(err.message),
  })

  const televerser = useMutation({
    mutationFn: (fichier: File) => televerserLogoEntreprise(fichier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_IDENTITE })
      toast.success('Logo mis à jour.')
    },
    onError: (err: ApiError) => toast.error(err.message),
  })

  return (
    <section className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
      <h3 className="mb-1 text-[13px] font-semibold text-[#1B2A41]">Identité de l'entreprise</h3>
      <p className="mb-4 text-[12px] text-[#6B7280]">
        Réutilisée sur les documents RH générés (certificats).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Raison sociale">
          <Input value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)} />
        </FormField>
        <FormField label="Adresse">
          <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </FormField>
        <FormField label="Téléphone">
          <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </FormField>
        <FormField label="E-mail de contact">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
      </div>

      <div className="mt-2 flex items-end gap-4">
        <div>
          <span className="mb-1 block text-[12px] font-medium text-[#1B2A41]">Logo</span>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo de l'entreprise"
              className="h-16 w-auto rounded border border-[#D8D4CC]"
            />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded border border-dashed border-[#D8D4CC] text-[11px] text-[#9CA3AF]">
              Aucun logo
            </div>
          )}
        </div>
        <label className="cursor-pointer text-[12px] text-[#4A7C6B] hover:underline">
          {televerser.isPending ? 'Envoi…' : 'Téléverser un logo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={televerser.isPending}
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier) televerser.mutate(fichier)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      <div className="mt-4">
        <Button
          variant="primary"
          loading={enregistrer.isPending}
          onClick={() => enregistrer.mutate()}
        >
          Enregistrer
        </Button>
      </div>
    </section>
  )
}

function IdentiteEntrepriseSection() {
  const { data: identite, isLoading } = useQuery({
    queryKey: CLE_IDENTITE,
    queryFn: obtenirIdentiteEntreprise,
  })

  if (isLoading || !identite) {
    return (
      <section className="mt-5 rounded-xl border border-[#D8D4CC] bg-white p-5">
        <p className="text-[13px] text-[#6B7280]">Chargement…</p>
      </section>
    )
  }

  // key incluant modifieLe : force un remount (donc un nouvel état local) après un
  // enregistrement réussi, plutôt qu'un useEffect qui recopierait la prop dans le state
  // (react-hooks/set-state-in-effect — même piège déjà rencontré en T3.B1/T4.B2).
  return <IdentiteEntrepriseForm key={identite.modifieLe ?? 'nouveau'} identite={identite} />
}

export function ConfigurationPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Configuration & Paramétrage"
        subtitle="Politiques RH et identité de l'entreprise — Admin uniquement"
      />

      <div className="grid grid-cols-3 gap-4">
        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-2 text-[13px] font-semibold text-[#1B2A41]">Horaire de référence</h3>
          <p className="mb-3 text-[12px] text-[#6B7280]">Gestion des horaires — module Présence.</p>
          <button
            onClick={() => navigate('/presence')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Configurer l'horaire →
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-2 text-[13px] font-semibold text-[#1B2A41]">Jours fériés</h3>
          <p className="mb-3 text-[12px] text-[#6B7280]">
            Calendrier annuel — onglet dédié dans Demandes administratives.
          </p>
          <button
            onClick={() => navigate('/demandes')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Gérer les jours fériés →
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-2 text-[13px] font-semibold text-[#1B2A41]">Journal d'audit</h3>
          <p className="mb-3 text-[12px] text-[#6B7280]">
            Lecture seule, filtrable et recherchable.
          </p>
          <button
            onClick={() => navigate('/audit')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Consulter le journal →
          </button>
        </section>
      </div>

      <IdentiteEntrepriseSection />
    </div>
  )
}
