import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

const CORPS_REJET_DEFAUT =
  "Bonjour,\n\nNous vous remercions pour l'intérêt porté à notre entreprise et pour le temps " +
  'consacré à votre candidature. Après étude attentive de votre profil, nous ne donnerons ' +
  'malheureusement pas suite à celle-ci pour ce poste.\n\nNous vous souhaitons une pleine ' +
  "réussite dans vos recherches.\n\nCordialement,\nL'équipe recrutement HB Développement"

interface Props {
  open: boolean
  onCancel: () => void
  onConfirm: (corpsMessage: string) => void
  submitting: boolean
}

/** EF-REC-14 : message de rejet éditable avant envoi — utilisé depuis la fiche candidature et
 * depuis le glisser-déposer du kanban. */
export function RejectDialog({ open, onCancel, onConfirm, submitting }: Props) {
  const [corps, setCorps] = useState(CORPS_REJET_DEFAUT)
  // Réinitialise à l'ouverture — ajustement pendant le rendu (pattern recommandé par React pour
  // "reset state on prop change"), pas un effet, pour éviter les rendus en cascade.
  const [ouvertPrecedemment, setOuvertPrecedemment] = useState(open)
  if (open !== ouvertPrecedemment) {
    setOuvertPrecedemment(open)
    if (open) setCorps(CORPS_REJET_DEFAUT)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title="Rejeter la candidature"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="danger" loading={submitting} onClick={() => onConfirm(corps)}>
            Envoyer le rejet
          </Button>
        </>
      }
    >
      <p className="mb-2 text-[12px] text-[#6B7280]">
        Message envoyé au candidat — éditable avant envoi.
      </p>
      <textarea
        value={corps}
        onChange={(e) => setCorps(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] p-3 text-[13px] focus:border-[#1B2A41] focus:outline-none"
      />
    </Dialog>
  )
}
