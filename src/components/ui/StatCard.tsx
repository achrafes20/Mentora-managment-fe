import type { ReactNode } from 'react'
import { CornerMark } from './CornerMark'

export function StatCard({
  label,
  value,
  sub,
  accentColor,
  onClick,
}: {
  label: string
  value: number | string
  sub: string
  accentColor: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`relative w-full rounded-xl border border-[#D8D4CC] bg-white p-5 text-left transition-all ${
        onClick ? 'group hover:-translate-y-[2px] hover:shadow-md' : ''
      }`}
    >
      <CornerMark />
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
        {label}
      </p>
      <p
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-[38px] font-semibold leading-none text-[#1B2A41]"
      >
        {value}
      </p>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[11px] text-[#6B7280]">{sub}</span>
      </div>
      {onClick && (
        <div
          className="absolute right-0 bottom-0 left-0 h-[2px] rounded-b-xl opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </Comp>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-[22px] font-semibold text-[#1B2A41]"
        >
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
