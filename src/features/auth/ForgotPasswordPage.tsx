import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/lib/authApi'
import { HBLogo } from '@/components/ui/HBLogo'
export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessayez dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4]">
      <div className="w-full max-w-[340px]">
        <div className="mb-9 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#1B2A41] shadow-md">
            <HBLogo size={30} />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[22px] font-semibold text-[#1B2A41]"
          >
            Réinitialisation
          </h1>
          <p className="mt-1 text-[13px] text-[#9CA3AF]">Saisissez votre identifiant ou e-mail</p>
        </div>

        <div className="rounded-xl border border-[#D8D4CC] bg-white p-7">
          {sent ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A7C6B]/10">
                <CheckCircle size={20} className="text-[#4A7C6B]" />
              </div>
              <p className="text-[13px] font-medium text-[#1B2A41]">E-mail envoyé</p>
              <p className="text-[12px] leading-relaxed text-[#6B7280]">
                Si un compte correspond à ces informations, un e-mail a été envoyé.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-block text-[12px] text-[#4A7C6B] underline underline-offset-2"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[12px] text-[#C1495A]">
                  {error}
                </p>
              )}
              <div>
                <label className="text-[12px] font-medium text-[#1B2A41]">
                  Identifiant ou e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hbdev.ma"
                  className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] transition-colors focus:border-[#1B2A41] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-50"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
              </button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-[12px] text-[#6B7280] underline underline-offset-2 hover:text-[#1B2A41]"
                >
                  ← Retour
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
