import { useEffect, useState } from 'react'
import { Check, CheckCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/lib/authApi'
import { HBLogo } from '@/components/ui/HBLogo'
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Lien invalide ou expiré. Demandez une nouvelle réinitialisation.')
    }
  }, [token])

  const criteria = [
    { label: '10 caractères minimum', ok: mdp.length >= 10 },
    { label: 'Au moins une majuscule', ok: /[A-Z]/.test(mdp) },
    { label: 'Au moins une minuscule', ok: /[a-z]/.test(mdp) },
    { label: 'Au moins un chiffre', ok: /\d/.test(mdp) },
  ]
  const allOk = criteria.every((c) => c.ok) && mdp === mdp2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !allOk) return
    setError(null)
    setLoading(true)
    try {
      await resetPassword(token, mdp)
      setSuccess(true)
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          'Lien invalide ou expiré. Demandez une nouvelle réinitialisation.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F4]">
      <div className="w-full max-w-[360px]">
        <div className="mb-9 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#1B2A41] shadow-md">
            <HBLogo size={30} />
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[22px] font-semibold text-[#1B2A41]"
          >
            Nouveau mot de passe
          </h1>
        </div>

        <div className="rounded-xl border border-[#D8D4CC] bg-white p-7">
          {success ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A7C6B]/10">
                <CheckCircle size={20} className="text-[#4A7C6B]" />
              </div>
              <p className="text-[13px] font-medium text-[#1B2A41]">Mot de passe réinitialisé</p>
              <button
                onClick={() => navigate('/login')}
                className="text-[12px] text-[#4A7C6B] underline underline-offset-2"
              >
                Se connecter →
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-[#C1495A]/20 bg-[#C1495A]/8 p-3 text-[12px] text-[#C1495A]">
                  {error}
                </p>
              )}
              {token && (
                <>
                  <div>
                    <label className="text-[12px] font-medium text-[#1B2A41]">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={mdp}
                      onChange={(e) => setMdp(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1.5 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2.5 text-[13px] transition-colors focus:border-[#1B2A41] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 py-1">
                    {criteria.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <div
                          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                            c.ok ? 'bg-[#4A7C6B]' : 'bg-[#D8D4CC]'
                          }`}
                        >
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                        <span
                          className={`text-[11px] transition-colors ${
                            c.ok ? 'text-[#4A7C6B]' : 'text-[#9CA3AF]'
                          }`}
                        >
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#1B2A41]">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={mdp2}
                      onChange={(e) => setMdp2(e.target.value)}
                      placeholder="••••••••"
                      className={`mt-1.5 w-full rounded-lg border bg-[#F7F7F4] px-3 py-2.5 text-[13px] transition-colors focus:outline-none ${
                        mdp2 && mdp !== mdp2
                          ? 'border-[#C1495A] focus:border-[#C1495A]'
                          : 'border-[#D8D4CC] focus:border-[#1B2A41]'
                      }`}
                    />
                    {mdp2 && mdp !== mdp2 && (
                      <p className="mt-1 text-[11px] text-[#C1495A]">
                        Les mots de passe ne correspondent pas.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !allOk}
                    className="w-full rounded-lg bg-[#1B2A41] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#243650] disabled:opacity-40"
                  >
                    {loading ? 'Réinitialisation…' : 'Réinitialiser'}
                  </button>
                </>
              )}
              <div className="text-center">
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-[12px] text-[#4A7C6B] hover:underline"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
