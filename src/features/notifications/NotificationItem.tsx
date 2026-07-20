import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bell, Briefcase, FileText, Settings, UserCheck2, Users } from 'lucide-react'
import type { NotificationInApp } from './notificationsApi'

const ICONES = {
  authentification: Users,
  employe: Users,
  presence: UserCheck2,
  recrutement: Briefcase,
  demande_administrative: FileText,
  document: FileText,
  configuration: Settings,
  delegation: Users,
  notification: Bell,
} as const

export function NotificationItem({
  notification,
  compact = false,
  onOpen,
}: {
  notification: NotificationInApp
  compact?: boolean
  onOpen: () => void
}) {
  const Icone = ICONES[notification.module as keyof typeof ICONES] ?? Bell
  const dateRelative = formatDistanceToNow(new Date(notification.creeLe), {
    addSuffix: true,
    locale: fr,
  })

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-start gap-3 text-left transition-colors hover:bg-[#F7F7F4] ${
        compact
          ? 'border-b border-[#D8D4CC]/50 px-4 py-3 last:border-0'
          : `rounded-xl border border-[#D8D4CC] bg-white p-4 ${
              !notification.lu ? 'border-l-[3px] border-l-[#4A7C6B]' : ''
            }`
      }`}
    >
      <span className="mt-0.5 rounded-lg bg-[#4A7C6B]/10 p-1.5 text-[#4A7C6B]">
        <Icone size={compact ? 13 : 15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-snug font-semibold text-[#1B2A41]">
          {notification.titre}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-[#6B7280]">
          {notification.message}
        </span>
        <span className="mt-1 block text-[10px] text-[#9CA3AF]">{dateRelative}</span>
      </span>
      {!notification.lu && (
        <span
          aria-label="Non lue"
          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#4A7C6B]"
        />
      )}
    </button>
  )
}
