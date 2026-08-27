/**
 * Affiche un e-mail sous forme de lien `mailto:` cliquable (ouvre le client mail par défaut).
 * `stopPropagation` : évite de déclencher un clic de ligne parent (ex. navigation vers une fiche)
 * quand l'e-mail est affiché dans un tableau dont la ligne entière est cliquable.
 */
export function EmailLink({
  email,
  className = 'hover:underline',
}: {
  email?: string | null
  className?: string
}) {
  if (!email) return <>—</>
  return (
    <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()} className={className}>
      {email}
    </a>
  )
}
