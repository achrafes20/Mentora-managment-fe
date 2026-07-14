import { Modal } from 'antd'
import { useState } from 'react'
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
    <Modal
      title="Envoyer la carte par e-mail"
      open={open}
      onCancel={onClose}
      onOk={() =>
        onConfirm({
          objet,
          corps,
          destinataire: destinataire || undefined,
        })
      }
      okText="Confirmer l'envoi"
      cancelText="Annuler"
      confirmLoading={submitting}
      okButtonProps={{ style: { color: '#fff' } }}
      width={560}
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
    </Modal>
  )
}
