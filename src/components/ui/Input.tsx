import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const inputClass =
  'h-9 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 text-[13px] text-[#1B2A41] outline-none placeholder:text-[#9CA3AF] focus:border-[#1B2A41] disabled:cursor-not-allowed disabled:bg-[#F7F7F4] disabled:text-[#9CA3AF]'

/** Remplace `antd Input` — même usage en `Controller` react-hook-form (`{...field}`). */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />
  },
)
