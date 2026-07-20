import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/NotifContext'
import type { ApiError } from '@/lib/apiClient'
import { NotificationItem } from './NotificationItem'
import { CLE_NOTIFICATIONS, listerNotifications } from './notificationsApi'

const TAILLE_PAGE = 20

export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount, markRead, markAllRead } = useNotifications()
  const query = useQuery({
    queryKey: [...CLE_NOTIFICATIONS, user?.id, 'centre', page],
    queryFn: () => listerNotifications(page, TAILLE_PAGE),
  })

  async function ouvrirNotification(id: string, lienAction: string | null) {
    try {
      await markRead(id)
      if (lienAction) navigate(lienAction)
    } catch (error) {
      toast.error((error as ApiError).message ?? 'Impossible de marquer la notification comme lue')
    }
  }

  async function toutMarquerLu() {
    try {
      await markAllRead()
      toast.success('Toutes les notifications sont marquees comme lues')
    } catch (error) {
      toast.error((error as ApiError).message ?? 'Operation impossible')
    }
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              aria-label="Actualiser les notifications"
              onClick={() => void query.refetch()}
            >
              <RefreshCw size={13} /> Actualiser
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={() => void toutMarquerLu()}
            >
              Tout marquer comme lu
            </Button>
          </div>
        }
      />

      {query.isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="large" />
        </div>
      )}

      {query.isError && (
        <div className="rounded-xl border border-[#C1495A]/30 bg-white p-8 text-center">
          <p className="text-[13px] text-[#C1495A]">Impossible de charger les notifications.</p>
          <Button className="mt-3" variant="secondary" onClick={() => void query.refetch()}>
            Reessayer
          </Button>
        </div>
      )}

      {query.data && query.data.content.length === 0 && (
        <div className="rounded-xl border border-[#D8D4CC] bg-white p-12 text-center">
          <p className="text-[13px] text-[#6B7280]">Aucune notification pour le moment.</p>
        </div>
      )}

      <div className="space-y-2">
        {query.data?.content.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={() => void ouvrirNotification(notification.id, notification.lienAction)}
          />
        ))}
      </div>

      {query.data && query.data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-[11px] text-[#6B7280]">
            Page {query.data.page + 1} sur {query.data.totalPages} · {query.data.totalElements}{' '}
            notification(s)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((numero) => Math.max(0, numero - 1))}
              aria-label="Page precedente"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={query.data.last}
              onClick={() => setPage((numero) => numero + 1)}
              aria-label="Page suivante"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-[11px] text-[#9CA3AF]">
        Les notifications sont conservees 90 jours puis archivees automatiquement.
      </p>
    </div>
  )
}
