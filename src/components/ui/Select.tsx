import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

/** Remplace `antd Select` — API value/onChange comparable pour react-hook-form Controller. */
export function Select({
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Sélectionner…',
  disabled,
  className,
  id,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) onBlur?.()
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] outline-none',
          'focus:border-[#1B2A41] data-[placeholder]:text-[#9CA3AF]',
          'disabled:cursor-not-allowed disabled:bg-[#F7F7F4] disabled:text-[#9CA3AF]',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={16} className="text-[#9CA3AF]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-1000 max-h-64 w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-lg border border-[#D8D4CC] bg-white shadow-lg"
        >
          <SelectPrimitive.Viewport>
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex cursor-pointer items-center rounded-md px-3 py-2 pr-8 text-[13px] text-[#1B2A41] outline-none select-none',
                  'data-[highlighted]:bg-[#F7F7F4]',
                  'data-[disabled]:cursor-not-allowed data-[disabled]:text-[#9CA3AF]',
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check size={14} className="text-[#1B2A41]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
