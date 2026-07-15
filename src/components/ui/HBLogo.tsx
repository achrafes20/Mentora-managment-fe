/** Logo HB Développement — image officielle */
export function HBLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-hb.png"
      alt="HB Développement"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
