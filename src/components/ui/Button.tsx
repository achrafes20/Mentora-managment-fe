import { cn } from '@/lib/cn'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium transition-colors disabled:opacity-50'

const variants = {
  primary: 'bg-[#1B2A41] text-white hover:bg-[#243650]',
  secondary: 'border border-[#D8D4CC] bg-white text-[#1B2A41] hover:border-[#1B2A41]',
  danger: 'border border-[#C1495A]/30 bg-white text-[#C1495A] hover:bg-[#C1495A]/8',
  success: 'bg-[#4A7C6B] text-white hover:bg-[#3d6a5a]',
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
