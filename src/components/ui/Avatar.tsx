function initials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`
}

export function Avatar({
  prenom,
  nom,
  size = 'sm',
  photoUrl,
}: {
  prenom: string
  nom: string
  size?: 'sm' | 'md'
  photoUrl?: string | null
}) {
  const sizeClass = size === 'md' ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-[10px]'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${prenom} ${nom}`}
        className={`flex-shrink-0 rounded-lg object-cover ring-1 ring-[#D8D4CC] ${sizeClass}`}
      />
    )
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-[#1B2A41] font-medium text-white select-none ${sizeClass}`}
    >
      {initials(prenom, nom)}
    </div>
  )
}
