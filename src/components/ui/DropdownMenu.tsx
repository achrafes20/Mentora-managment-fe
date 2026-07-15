import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-1000 min-w-[160px] rounded-lg border border-[#D8D4CC] bg-white p-1 shadow-lg',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  danger,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { danger?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] outline-none select-none',
        danger ? 'text-[#C1495A] data-[highlighted]:bg-[#C1495A]/10' : 'text-[#1B2A41]',
        !danger && 'data-[highlighted]:bg-[#F7F7F4]',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-3 py-1.5 text-[11px] font-semibold text-[#9CA3AF] uppercase', className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('my-1 h-px bg-[#D8D4CC]', className)}
      {...props}
    />
  )
}

export function DropdownMenuIconItem({
  icon,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { icon: ReactNode }) {
  return (
    <DropdownMenuItem {...props}>
      {icon}
      {children}
    </DropdownMenuItem>
  )
}
