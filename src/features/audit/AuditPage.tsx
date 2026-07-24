import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Spinner } from '@/components/ui/Spinner'
import { listUsers } from '@/lib/authApi'
import { rechercherAudit, type ModuleAudit } from './auditApi'

const MODULE_LABELS: Record<ModuleAudit, string> = {
  authentification: 'Authentification',
  employe: 'Employé',
  presence: 'Présence',
  recrutement: 'Recrutement',
  demande_administrative: 'Demande administrative',
  document: 'Document',
  configuration: 'Configuration',
  delegation: 'Délégation',
  notification: 'Notification',
}

const MODULE_OPTIONS: SelectOption[] = Object.entries(MODULE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function dateVersParam(date: Date | null): string | undefined {
  return date ? format(date, 'yyyy-MM-dd') : undefined
}

export function AuditPage() {
  const [module, setModule] = useState<ModuleAudit | undefined>(undefined)
  const [utilisateurId, setUtilisateurId] = useState<string | undefined>(undefined)
  const [debut, setDebut] = useState<Date | null>(null)
  const [fin, setFin] = useState<Date | null>(null)
  const [recherche, setRecherche] = useState('')
  const [rechercheAppliquee, setRechercheAppliquee] = useState('')
  const [page, setPage] = useState(0)

  const { data: utilisateurs } = useQuery({ queryKey: ['utilisateurs-audit'], queryFn: listUsers })

  const filtres = {
    module,
    utilisateurId,
    debut: dateVersParam(debut),
    fin: dateVersParam(fin),
    recherche: rechercheAppliquee || undefined,
    page,
    size: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['audit', filtres],
    queryFn: () => rechercherAudit(filtres),
  })

  const utilisateurOptions: SelectOption[] =
    utilisateurs?.map((u) => ({ value: u.id, label: `${u.prenom} ${u.nom} (${u.email})` })) ?? []

  function reinitialiser() {
    setModule(undefined)
    setUtilisateurId(undefined)
    setDebut(null)
    setFin(null)
    setRecherche('')
    setRechercheAppliquee('')
    setPage(0)
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Journal d'audit" subtitle="Lecture seule — aucune modification possible" />

      <div className="mb-5 grid grid-cols-5 gap-3">
        <Input
          placeholder="Rechercher (action, élément, détail)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(0)
              setRechercheAppliquee(recherche)
            }
          }}
        />
        <Select
          value={module}
          onChange={(v) => {
            setPage(0)
            setModule(v as ModuleAudit)
          }}
          options={MODULE_OPTIONS}
          placeholder="Tous les modules"
        />
        <Select
          value={utilisateurId}
          onChange={(v) => {
            setPage(0)
            setUtilisateurId(v)
          }}
          options={utilisateurOptions}
          placeholder="Tous les utilisateurs"
        />
        <DatePicker
          value={debut}
          onChange={(d) => {
            setPage(0)
            setDebut(d)
          }}
          placeholder="Du…"
        />
        <DatePicker
          value={fin}
          onChange={(d) => {
            setPage(0)
            setFin(d)
          }}
          placeholder="Au…"
        />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => {
            setPage(0)
            setRechercheAppliquee(recherche)
          }}
        >
          Rechercher
        </Button>
        <button onClick={reinitialiser} className="text-[12px] text-[#6B7280] hover:text-[#1B2A41]">
          Réinitialiser les filtres
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : !data || data.content.length === 0 ? (
        <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
          Aucune entrée d'audit pour ces filtres.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                {['Date/Heure', 'Utilisateur', 'Action', 'Module', 'Élément', 'Délégation'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.content.map((entree) => {
                const utilisateur = utilisateurs?.find((u) => u.id === entree.utilisateurId)
                return (
                  <tr
                    key={entree.id}
                    className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
                  >
                    <td
                      style={{ fontFamily: 'var(--font-code)' }}
                      className="px-4 py-3.5 text-[11px] text-[#9CA3AF]"
                    >
                      {entree.horodatage
                        ? format(new Date(entree.horodatage), 'dd MMM yyyy HH:mm:ss', {
                            locale: fr,
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#1B2A41]">
                      {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{entree.action}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">
                      {entree.module ? MODULE_LABELS[entree.module] : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#9CA3AF]">
                      {entree.entiteType ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#9CA3AF]">
                      {entree.enDelegation ? 'Oui' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#D8D4CC] px-4 py-3">
            <span className="text-[12px] text-[#6B7280]">
              Page {data.page + 1} sur {Math.max(data.totalPages, 1)} ({data.totalElements} entrées)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="secondary"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
