import { useEffect, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'
interface ToastItem {
  id: number
  variant: ToastVariant
  text: string
}

let idSeq = 0
let listeners: Array<(items: ToastItem[]) => void> = []
let items: ToastItem[] = []

function emit() {
  listeners.forEach((l) => l(items))
}

function push(variant: ToastVariant, text: string) {
  const id = ++idSeq
  items = [...items, { id, variant, text }]
  emit()
  setTimeout(() => {
    items = items.filter((i) => i.id !== id)
    emit()
  }, 3500)
}

/** Remplace `antd`'s `message` — mêmes signatures d'appel (`toast.success('...')`). */
export const toast = {
  success: (text: string) => push('success', text),
  error: (text: string) => push('error', text),
  warning: (text: string) => push('warning', text),
  info: (text: string) => push('info', text),
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-[#4A7C6B]/30 bg-[#4A7C6B]/10 text-[#4A7C6B]',
  error: 'border-[#C1495A]/30 bg-[#C1495A]/10 text-[#C1495A]',
  warning: 'border-[#C87F3A]/30 bg-[#C87F3A]/10 text-[#C87F3A]',
  info: 'border-[#1B2A41]/20 bg-white text-[#1B2A41]',
}

export function Toaster() {
  const [current, setCurrent] = useState<ToastItem[]>(items)

  useEffect(() => {
    listeners.push(setCurrent)
    return () => {
      listeners = listeners.filter((l) => l !== setCurrent)
    }
  }, [])

  if (current.length === 0) return null

  return (
    <div className="fixed right-4 bottom-4 z-1000 flex flex-col gap-2">
      {current.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`rounded-lg border px-4 py-2 text-[13px] shadow-md ${VARIANT_STYLES[item.variant]}`}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
