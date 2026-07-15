import { cn } from '@/lib/cn'

const SIZES = {
  small: 'h-4 w-4 border-2',
  default: 'h-6 w-6 border-2',
  large: 'h-10 w-10 border-[3px]',
} as const

export function Spinner({
  size = 'default',
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className={cn(
        'animate-spin rounded-full border-[#D8D4CC] border-t-[#1B2A41]',
        SIZES[size],
        className,
      )}
    />
  )
}
