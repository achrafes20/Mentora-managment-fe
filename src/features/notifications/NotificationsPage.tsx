import { useNotifications } from '@/lib/NotifContext'
import { PageHeader } from '@/components/ui/StatCard'
import { MockBanner } from '@/components/ui/MockBanner'

export function NotificationsPage() {
  const { notifications, markAllRead } = useNotifications()

  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="notifications" />
      <PageHeader
        title="Notifications"
        subtitle="Centre de notifications in-app"
        actions={
          <button
            onClick={markAllRead}
            className="rounded-lg border border-[#D8D4CC] px-3 py-2 text-[12px] text-[#6B7280] hover:border-[#1B2A41]"
          >
            Tout marquer comme lu
          </button>
        }
      />

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border border-[#D8D4CC] bg-white p-4 ${
              n.unread ? 'border-l-[3px] border-l-[#4A7C6B]' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[#1B2A41]">{n.text}</p>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">{n.time}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-[#9CA3AF]">Les notifications sont conservées 90 jours.</p>
    </div>
  )
}
