// wa.me exige un numéro complet, sans '+', espaces ni tirets. Les numéros saisis dans l'app sont
// en format local marocain (0X XX XX XX XX) — on retire le 0 initial et on préfixe l'indicatif
// 212 ; un numéro déjà international (commence par +) est simplement dépouillé de son '+'.
function whatsappHref(telephone: string): string {
  const chiffres = telephone.replace(/[^\d+]/g, '')
  const sansPlus = chiffres.startsWith('+') ? chiffres.slice(1) : chiffres
  const international = sansPlus.startsWith('0') ? `212${sansPlus.slice(1)}` : sansPlus
  return `https://wa.me/${international}`
}

/**
 * Affiche un numéro de téléphone sous forme de lien WhatsApp cliquable (ouvre wa.me dans un
 * nouvel onglet). `stopPropagation` : évite de déclencher un clic de ligne parent (ex. navigation
 * vers une fiche) quand le numéro est affiché dans un tableau dont la ligne entière est cliquable.
 */
export function WhatsappLink({
  telephone,
  className = 'hover:underline',
}: {
  telephone?: string | null
  className?: string
}) {
  if (!telephone) return <>—</>
  return (
    <a
      href={whatsappHref(telephone)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {telephone}
    </a>
  )
}
