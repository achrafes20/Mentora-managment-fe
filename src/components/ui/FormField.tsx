import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}

/** Remplace `antd Form.Item` — label/erreur autour d'un champ contrôlé (react-hook-form). */
export function FormField({ label, error, required, hint, children, htmlFor }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
        {label}
        {required && <span className="text-[#C1495A]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-[#6B7280]">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-[#C1495A]">{error}</p>}
    </div>
  )
}
