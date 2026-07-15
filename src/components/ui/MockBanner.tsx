import { Construction } from 'lucide-react'
import { useMockData, type FeatureKey } from '@/lib/featureFlags'

/**
 * Bannière obligatoire sur tout écran dont le `featureFlags` correspondant
 * est encore `false` — jamais de données de démonstration affichées sans
 * indication visible qu'elles ne sont pas réelles.
 */
export function MockBanner({ feature }: { feature: FeatureKey }) {
  if (!useMockData(feature)) return null

  return (
    <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-[#C87F3A]/30 bg-[#C87F3A]/8 px-4 py-2.5 text-[13px] text-[#C87F3A]">
      <Construction size={16} className="shrink-0" />
      <span>
        <strong className="font-medium">Aperçu — données de démonstration.</strong> Ce module est en
        cours de construction ; rien ici n'est branché sur des données réelles.
      </span>
    </div>
  )
}
