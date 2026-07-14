import { TAG_STYLES, tagVariant } from './tokens'

export function StatusTag({ statut }: { statut: string }) {
  const v = tagVariant(statut)
  const { wrap, dot } = TAG_STYLES[v]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium ${wrap}`}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
      {statut}
    </span>
  )
}
