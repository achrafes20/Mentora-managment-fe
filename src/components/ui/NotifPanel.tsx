import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NotificationItem } from '@/features/notifications/NotificationItem'
import { useNotifications } from '@/lib/NotifContext'
import { Spinner } from './Spinner'

export function NotifPanel() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    panelOpen,
    closePanel,
    markRead,
    markAllRead,
    isLoading,
    isError,
    refresh,
  } = useNotifications()

  if (!panelOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={closePanel} aria-hidden="true" />
      <section
        aria-label="Notifications"
        className="fixed top-14 left-[212px] z-50 w-[360px] rounded-xl border border-[#D8D4CC] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#D8D4CC] px-4 py-3">
          <p className="text-[13px] font-semibold text-[#1B2A41]">Notifications</p>
          <button
            type="button"
            aria-label="Fermer les notifications"
            onClick={closePanel}
            className="rounded p-1 text-[#9CA3AF] hover:bg-[#F7F7F4]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          )}
          {isError && (
            <div className="p-5 text-center text-[12px] text-[#C1495A]">
              <p>Impossible de charger les notifications.</p>
              <button type="button" onClick={() => void refresh()} className="mt-2 underline">
                Reessayer
              </button>
            </div>
          )}
          {!isLoading && !isError && notifications.length === 0 && (
            <p className="p-8 text-center text-[12px] text-[#9CA3AF]">Aucune notification.</p>
          )}
          {!isLoading &&
            !isError &&
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact
                onOpen={() => {
                  const destination = notification.lienAction
                  void markRead(notification.id)
                    .catch(() => undefined)
                    .finally(() => {
                      if (destination) navigate(destination)
                      closePanel()
                    })
                }}
              />
            ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#D8D4CC] px-4 py-2.5">
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
            className="text-[11px] text-[#4A7C6B] hover:underline disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/notifications')
              closePanel()
            }}
            className="text-[11px] text-[#4A7C6B] hover:underline"
          >
            Voir toutes →
          </button>
        </div>
      </section>
    </>
  )
}
