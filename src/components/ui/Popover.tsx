import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverClose = PopoverPrimitive.Close

/**
 * Pour du contenu interactif arbitraire (formulaire, contrôles natifs) dans un panneau flottant —
 * contrairement à `DropdownMenu`, qui modélise une liste de commandes (`role="menu"`) et dont la
 * navigation clavier/typeahead peut interférer avec un `<input>` natif à l'intérieur.
 */
export function PopoverContent({
  className,
  align = 'end',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-1000 rounded-lg border border-[#D8D4CC] bg-white p-3 shadow-lg outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
