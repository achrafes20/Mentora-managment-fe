const GOLD = '#D4A64A'

/** Logo HB pour la carte employé — H blanc, B or */
export function HBLogoCard({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <text x="2" y="38" fontFamily="Inter, sans-serif" fontSize="40" fontWeight="800" fill="white">
        H
      </text>
      <text x="22" y="38" fontFamily="Inter, sans-serif" fontSize="40" fontWeight="800" fill={GOLD}>
        B
      </text>
    </svg>
  )
}

/** Filigrane HB grand format (opacité contrôlée par le parent) */
export function HBWatermark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <text
        x="10"
        y="155"
        fontFamily="Inter, sans-serif"
        fontSize="160"
        fontWeight="800"
        fill="white"
      >
        H
      </text>
      <text
        x="95"
        y="155"
        fontFamily="Inter, sans-serif"
        fontSize="160"
        fontWeight="800"
        fill={GOLD}
      >
        B
      </text>
    </svg>
  )
}
