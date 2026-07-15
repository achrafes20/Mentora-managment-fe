import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { Employe } from './employesApi'
import { corpsEmailCarteDefaut, objetEmailCarteDefaut } from './carteUtils'

interface Props {
  open: boolean
  employe: Employe
  submitting: boolean
  onClose: () => void
  onConfirm: (payload: { objet: string; corps: string; destinataire?: string }) => void
}

export function CarteEmailModal({ open, employe, submitting, onClose, onConfirm }: Props) {
  const [objet, setObjet] = useState(objetEmailCarteDefaut(employe.prenom ?? '', employe.nom ?? ''))
  const [corps, setCorps] = useState(corpsEmailCarteDefaut(employe.prenom ?? '', employe.nom ?? ''))
  const [destinataire, setDestinataire] = useState(employe.email ?? '')

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Envoyer la carte par e-mail"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            loading={submitting}
            onClick={() => onConfirm({ objet, corps, destinataire: destinataire || undefined })}
          >
            Confirmer l'envoi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            Destinataire
          </label>
          <input
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            placeholder="email@hbdev.ma"
            className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            Objet
          </label>
          <input
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium tracking-wider text-[#9CA3AF] uppercase">
            Corps du message
          </label>
          <textarea
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            rows={8}
            className="mt-1 w-full resize-y rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px] leading-relaxed text-[#1B2A41] focus:border-[#1B2A41] focus:outline-none"
          />
        </div>
      </div>
    </Dialog>
  )
}
