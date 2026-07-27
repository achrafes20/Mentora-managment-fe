import { ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import type { Departement } from './api'
import type { DesactivationRequete, Employe } from './employesApi'
import { libelleManager, type Manager } from './useManagers'

interface Props {
  employe: Employe
  departements: Departement[]
  managers: Manager[]
  submitting: boolean
  onClose: () => void
  onConfirm: (values: {
    nouveauDepartementId: string
    nouveauManagerId?: string
    dateEffet: string
  }) => void
}

export function TransferModal({
  employe,
  departements,
  managers,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [deptId, setDeptId] = useState('')
  const [managerId, setManagerId] = useState('')
  const [date, setDate] = useState('')

  const managersFiltres = managers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#1B2A41]/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#D8D4CC] bg-[#F7F7F4] px-6 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#1B2A41]">Transférer l'employé</h2>
            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
              {employe.prenom} {employe.nom} — {employe.departementNom}
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1B2A41]">
            <X size={15} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="text-[11px] font-medium text-[#1B2A41]">Nouveau département</label>
            <select
              value={deptId}
              onChange={(e) => {
                setDeptId(e.target.value)
                setManagerId('')
              }}
              className="mt-1.5 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
            >
              <option value="">— Sélectionner —</option>
              {departements
                .filter((d) => d.id !== employe.departementId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#1B2A41]">Nouveau manager</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="mt-1.5 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
            >
              <option value="">— Sélectionner (optionnel) —</option>
              {managersFiltres.map((m) => (
                <option key={m.id} value={m.id}>
                  {libelleManager(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#1B2A41]">Date d'effet</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
            />
          </div>
          <div className="rounded-lg border border-[#D8D4CC]/60 bg-[#F7F7F4] p-3 text-[11px] text-[#9CA3AF]">
            Ce transfert n'affecte pas le solde de congés ni l'historique de présence déjà
            enregistré.
          </div>
          <div className="flex gap-3 pt-1">
            <button
              disabled={!deptId || !date || submitting}
              onClick={() =>
                onConfirm({
                  nouveauDepartementId: deptId,
                  nouveauManagerId: managerId || undefined,
                  dateEffet: date,
                })
              }
              className="flex-1 rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-40"
            >
              {submitting ? 'Transfert…' : 'Confirmer le transfert'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[#D8D4CC] px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#1B2A41]"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MOTIFS = [
  { value: 'demission', label: 'Démission' },
  { value: 'licenciement', label: 'Licenciement' },
  { value: 'fin_cdd', label: 'Fin de CDD' },
  { value: 'rupture', label: 'Rupture conventionnelle' },
  { value: 'autre', label: 'Autre' },
] as const

interface DepartureProps {
  employe: Employe
  submitting: boolean
  onClose: () => void
  onConfirm: (values: DesactivationRequete, genererCertificat: boolean) => void
}

export function DepartureModal({ employe, submitting, onClose, onConfirm }: DepartureProps) {
  const [step, setStep] = useState(1)
  const [dateDepart, setDateDepart] = useState('')
  const [motif, setMotif] = useState<DesactivationRequete['motif'] | ''>('')
  const [genererCertificat, setGenererCertificat] = useState(true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#1B2A41]/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="h-1 bg-[#D8D4CC]">
          <div
            className="h-full bg-[#1B2A41] transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between border-b border-[#D8D4CC] bg-[#F7F7F4] px-6 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#1B2A41]">
              Départ de {employe.prenom} {employe.nom}
            </h2>
            <p className="text-[11px] text-[#9CA3AF]">Étape {step} / 3</p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1B2A41]">
            <X size={15} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[12px] font-medium tracking-wider text-[#9CA3AF] uppercase">
                Informations de départ
              </p>
              <div>
                <label className="text-[11px] font-medium text-[#1B2A41]">Date de départ</label>
                <input
                  type="date"
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#1B2A41]">Motif</label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value as DesactivationRequete['motif'])}
                  className="mt-1.5 w-full cursor-pointer rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] focus:border-[#1B2A41] focus:outline-none"
                >
                  <option value="">— Sélectionner —</option>
                  {MOTIFS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!dateDepart || !motif}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-40"
              >
                Suivant <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[12px] font-medium tracking-wider text-[#9CA3AF] uppercase">
                Récapitulatif
              </p>
              <div className="space-y-3 rounded-xl border border-[#D8D4CC] bg-[#F7F7F4] p-4">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">Date de départ</span>
                  <span
                    style={{ fontFamily: 'var(--font-code)' }}
                    className="font-medium text-[#1B2A41]"
                  >
                    {dateDepart}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">Motif</span>
                  <span className="font-medium text-[#1B2A41]">
                    {MOTIFS.find((m) => m.value === motif)?.label}
                  </span>
                </div>
                <div className="border-t border-[#D8D4CC] pt-3">
                  <p className="text-[10px] text-[#9CA3AF]">
                    Le QR code de la carte badge sera automatiquement bloqué à la date de départ
                    saisie.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-[#D8D4CC] px-4 py-2.5 text-[13px] text-[#6B7280]"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white"
                >
                  Suivant <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[12px] font-medium tracking-wider text-[#9CA3AF] uppercase">
                Confirmation
              </p>
              <div className="rounded-xl border border-[#C1495A]/20 bg-[#C1495A]/6 p-4">
                <p className="text-[13px] font-medium text-[#C1495A]">
                  Cette action est irréversible.
                </p>
                <p className="mt-1 text-[12px] text-[#C1495A]/80">
                  La fiche de {employe.prenom} {employe.nom} sera désactivée le{' '}
                  <strong>{dateDepart}</strong>.
                </p>
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-[#1B2A41]">
                <input
                  type="checkbox"
                  checked={genererCertificat}
                  onChange={(e) => setGenererCertificat(e.target.checked)}
                  className="rounded border-[#D8D4CC] text-[#1B2A41] focus:ring-[#1B2A41]"
                />
                Générer et envoyer le certificat de travail par e-mail
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-[#D8D4CC] px-4 py-2.5 text-[13px] text-[#6B7280]"
                >
                  ← Retour
                </button>
                <button
                  disabled={submitting}
                  onClick={() =>
                    onConfirm(
                      { motif: motif as DesactivationRequete['motif'], dateDepart },
                      genererCertificat,
                    )
                  }
                  className="flex-1 rounded-lg bg-[#C1495A] py-2.5 text-[13px] font-medium text-white hover:bg-[#a83d4b] disabled:opacity-40"
                >
                  {submitting ? 'Traitement…' : 'Confirmer le départ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
