import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { HBLogo } from '@/components/ui/HBLogo'
import { ROSE_MARQUE } from '@/components/ui/tokens'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/tableau-de-bord'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLocked(false)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Identifiant ou mot de passe incorrect.'
      if (msg.toLowerCase().includes('verrouillé')) {
        setLocked(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4]">
      <div className="w-full max-w-[340px]">
        <div className="mb-9 text-center">
          <div className="relative inline-flex flex-col items-center">
            <div
              className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B2A41] shadow-lg"
              style={{ boxShadow: `0 0 0 1px ${ROSE_MARQUE}22, 0 8px 24px ${ROSE_MARQUE}18` }}
            >
              <HBLogo size={38} />
            </div>
            <div
              className="mb-4 h-[2px] w-8 rounded-full"
              style={{ backgroundColor: ROSE_MARQUE, opacity: 0.6 }}
            />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[22px] font-semibold text-[#1B2A41]"
          >
            HB Développement
          </h1>
          <p className="mt-1 text-[13px] text-[#9CA3AF]">Espace RH — Accès réservé</p>
        </div>

        {locked ? (
          <div className="rounded-xl border border-[#D8D4CC] bg-white p-7">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C1495A]/8">
                <Lock size={20} className="text-[#C1495A]" />
              </div>
              <p className="text-[14px] font-semibold text-[#C1495A]">
                Compte temporairement verrouillé
              </p>
              <p className="text-[12px] leading-relaxed text-[#C1495A]/80">
                Suite à plusieurs tentatives échouées. Réessayez dans quelques minutes, ou contactez
                un administrateur.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5 rounded-xl border border-[#D8D4CC] bg-white p-7"
          >
            <div>
              <label className="text-[12px] font-medium text-[#1B2A41]">Identifiant (e-mail)</label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="admin@hbdev.ma"
                className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] text-[#1B2A41] transition-colors focus:border-[#1B2A41] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#1B2A41]">Mot de passe</label>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] text-[#1B2A41] transition-colors focus:border-[#1B2A41] focus:outline-none"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-[#C1495A]" />
                <p className="text-[12px] text-[#C1495A]">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <div className="text-center">
              <Link
                to="/mot-de-passe-oublie"
                className="text-[12px] text-[#6B7280] underline underline-offset-2 transition-colors hover:text-[#1B2A41]"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
