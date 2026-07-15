import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/StatCard'
import { MockBanner } from '@/components/ui/MockBanner'

export function ConfigurationPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="config" />
      <PageHeader
        title="Configuration & Paramétrage"
        subtitle="Paramètres système — Admin uniquement"
      />

      <div className="space-y-5">
        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Horaire de référence</h3>
          <p className="mb-3 text-[12px] text-[#6B7280]">
            08h30–13h00 / 14h00–17h00 — Tolérance 10 min
          </p>
          <button
            onClick={() => navigate('/presence')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Configurer l'horaire →
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Jours fériés</h3>
          <button
            onClick={() => navigate('/feries')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Gérer les jours fériés →
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Recrutement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] text-[#6B7280]">Seuil de score (%)</label>
              <input
                type="number"
                defaultValue={70}
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] text-[#6B7280]">Rétention (mois)</label>
              <input
                type="number"
                defaultValue={6}
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
              />
            </div>
          </div>
          <button className="mt-3 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] text-white">
            Enregistrer
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Sécurité des comptes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] text-[#6B7280]">Tentatives avant verrouillage</label>
              <input
                type="number"
                defaultValue={5}
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] text-[#6B7280]">Délai déverrouillage (min)</label>
              <input
                type="number"
                defaultValue={15}
                className="mt-1 w-full rounded-lg border border-[#D8D4CC] bg-[#F7F7F4] px-3 py-2 text-[13px]"
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#9CA3AF]">
            Politique mot de passe : 10 caractères min., majuscules, minuscules, chiffres.
          </p>
          <button className="mt-3 rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] text-white">
            Enregistrer
          </button>
        </section>

        <section className="rounded-xl border border-[#D8D4CC] bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#1B2A41]">Journal d'audit</h3>
          <button
            onClick={() => navigate('/audit')}
            className="text-[12px] text-[#4A7C6B] hover:underline"
          >
            Consulter le journal →
          </button>
        </section>
      </div>

      <p className="mt-6 text-[11px] text-[#9CA3AF]">
        Toute modification est journalisée dans le journal d'audit.
      </p>
    </div>
  )
}

export function FeriesPage() {
  const navigate = useNavigate()
  const ferries = [
    { date: '01/01/2024', nom: 'Nouvel An', type: 'Fixe' },
    { date: '01/05/2024', nom: 'Fête du Travail', type: 'Fixe' },
    { date: '10/04/2024', nom: 'Aïd al-Fitr', type: 'Mobile' },
  ]

  return (
    <div className="flex-1 overflow-auto p-8">
      <MockBanner feature="config" />
      <button
        onClick={() => navigate('/configuration')}
        className="mb-4 text-[12px] text-[#6B7280] hover:text-[#1B2A41]"
      >
        ← Retour à la configuration
      </button>
      <PageHeader
        title="Jours fériés"
        subtitle="Calendrier annuel"
        actions={
          <button className="rounded-lg bg-[#1B2A41] px-4 py-2 text-[12px] text-white">
            + Ajouter un jour férié
          </button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-[#D8D4CC] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
              {['Date', 'Nom', 'Type'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ferries.map((f) => (
              <tr
                key={f.date}
                className="border-b border-[#D8D4CC]/50 transition-colors last:border-0 hover:bg-[#F7F7F4]"
              >
                <td
                  style={{ fontFamily: 'var(--font-code)' }}
                  className="px-4 py-3.5 text-[13px] text-[#1B2A41]"
                >
                  {f.date}
                </td>
                <td className="px-4 py-3.5 text-[13px] text-[#1B2A41]">
                  {f.type === 'Mobile' && <span className="mr-1.5">🌙</span>}
                  {f.nom}
                </td>
                <td className="px-4 py-3.5 text-[12px] text-[#6B7280]">{f.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[11px] text-[#9CA3AF]">
        Un jour férié inclus dans une période de congé approuvée n'est pas décompté du solde.
      </p>
    </div>
  )
}
