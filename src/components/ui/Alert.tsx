import { AlertCircle } from 'lucide-react'

/** Remplace `antd Alert type="error"` — bandeau d'erreur inline dans un formulaire. */
export function Alert({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#C1495A]/30 bg-[#C1495A]/8 px-3 py-2.5 text-[13px] text-[#C1495A]">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
