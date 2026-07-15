import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toast'
import { ConfirmDialogHost } from '@/components/ui/confirm'
import { AuthProvider } from '@/lib/AuthContext'
import { NotifProvider } from '@/lib/NotifContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotifProvider>
          {children}
          <Toaster />
          <ConfirmDialogHost />
        </NotifProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
