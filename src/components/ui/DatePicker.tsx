import * as PopoverPrimitive from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '@/lib/cn'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
}

/** Remplace `antd DatePicker` — value/onChange en `Date` native, locale française. */
export function DatePicker({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = 'jj/mm/aaaa',
  className,
  id,
}: DatePickerProps) {
  return (
    <PopoverPrimitive.Root
      onOpenChange={(open) => {
        if (!open) onBlur?.()
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-[#D8D4CC] bg-white px-3 text-left text-[13px] text-[#1B2A41] outline-none',
            'focus:border-[#1B2A41]',
            'disabled:cursor-not-allowed disabled:bg-[#F7F7F4] disabled:text-[#9CA3AF]',
            className,
          )}
        >
          <span className={!value ? 'text-[#9CA3AF]' : undefined}>
            {value ? format(value, 'dd/MM/yyyy', { locale: fr }) : placeholder}
          </span>
          <CalendarDays size={15} className="text-[#9CA3AF]" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          className="rdp-popover z-1000 rounded-lg border border-[#D8D4CC] bg-white p-2 shadow-lg"
        >
          <DayPicker
            mode="single"
            locale={fr}
            selected={value ?? undefined}
            onSelect={(date) => onChange(date ?? null)}
            defaultMonth={value ?? undefined}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
