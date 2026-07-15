import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}

/** Remplace `antd Modal` — même usage contrôlé (`open`/`onOpenChange`). */
export function Dialog({ open, onOpenChange, title, children, footer, width = 520 }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-900 bg-black/40" />
        <DialogPrimitive.Content
          style={{ maxWidth: width }}
          className="fixed top-1/2 left-1/2 z-901 max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl focus:outline-none"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="font-display text-[18px] text-[#1B2A41]">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="shrink-0 text-[#9CA3AF] hover:text-[#1B2A41]">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className="text-[13px] text-[#1B2A41]">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mb-3 text-[13px] text-[#6B7280]', className)} {...props} />
}
