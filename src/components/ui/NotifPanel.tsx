import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useNotifications } from '@/lib/NotifContext'
import type { MockNotification } from '@/lib/mockData'

const TYPE_ICONS: Record<MockNotification['type'], string> = {
  approbation: '✓',
  candidat: '👤',
  fin_contrat: '📋',
  anomalie: '⚠',
  systeme: 'ℹ',
}

export function NotifPanel() {
  const navigate = useNavigate()
  const { notifications, panelOpen, closePanel, markAllRead } = useNotifications()

  if (!panelOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={closePanel} />
      <div className="fixed top-14 left-[212px] z-50 w-[360px] rounded-xl border border-[#D8D4CC] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D8D4CC] px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1B2A41]">Notifications</p>
          <button onClick={closePanel} className="rounded p-1 text-[#9CA3AF] hover:bg-[#F7F7F4]">
            <X size={14} />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                navigate(n.path)
                closePanel()
              }}
              className="flex w-full items-start gap-3 border-b border-[#D8D4CC]/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#F7F7F4]"
            >
              <span className="mt-0.5 text-sm">{TYPE_ICONS[n.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-snug text-[#1B2A41]">{n.text}</p>
                <p className="mt-1 text-[10px] text-[#9CA3AF]">{n.time}</p>
              </div>
              {n.unread && (
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#4A7C6B]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#D8D4CC] px-4 py-2.5">
          <button onClick={markAllRead} className="text-[11px] text-[#4A7C6B] hover:underline">
            Tout marquer comme lu
          </button>
          <button
            onClick={() => {
              navigate('/notifications')
              closePanel()
            }}
            className="text-[11px] text-[#4A7C6B] hover:underline"
          >
            Voir toutes →
          </button>
        </div>
      </div>
    </>
  )
}
