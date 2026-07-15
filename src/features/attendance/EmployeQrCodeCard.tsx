import { QrCode as QrCodeIcon, RefreshCw, Ban } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import { genererQrCode, qrCodeActif, type QrCodeReponse } from './api'

interface Props {
  employeId: string
  estAdmin: boolean
}

/** Encart QR code sur la fiche employé — affiche le QR code actif, permet de le générer/régénérer. */
export function EmployeQrCodeCard({ employeId, estAdmin }: Props) {
  const [qr, setQr] = useState<QrCodeReponse | null>(null)
  const [loading, setLoading] = useState(false)

  const charger = useCallback(async () => {
    try {
      const result = await qrCodeActif(employeId)
      setQr(result)
    } catch {
      // ignore
    }
  }, [employeId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger()
  }, [charger])

  async function handleGenerer() {
    setLoading(true)
    try {
      const newQr = await genererQrCode(employeId)
      setQr(newQr)
      toast.success('QR code généré')
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#D8D4CC] bg-white">
      <div className="flex items-center justify-between border-b border-[#D8D4CC] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <QrCodeIcon size={14} className="text-[#6B7280]" />
          <p className="text-[12px] font-medium text-[#1B2A41]">QR Code de pointage</p>
        </div>
        {estAdmin && (
          <Button variant="secondary" loading={loading} onClick={() => void handleGenerer()}>
            <RefreshCw size={12} />
            {qr ? 'Régénérer' : 'Générer'}
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 p-5">
        {qr ? (
          <>
            <QRCode value={qr.valeur} size={144} />
            <dl className="w-full space-y-2 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-[#9CA3AF]">Valeur</dt>
                <dd style={{ fontFamily: 'var(--font-code)' }} className="text-[#1B2A41]">
                  {qr.valeur}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#9CA3AF]">Statut</dt>
                <dd className="flex gap-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      qr.actif ? 'bg-[#4A7C6B]/10 text-[#4A7C6B]' : 'bg-[#C1495A]/10 text-[#C1495A]'
                    }`}
                  >
                    {qr.actif ? 'Actif' : 'Inactif'}
                  </span>
                  {qr.bloque && (
                    <span className="flex items-center gap-1 rounded bg-[#C1495A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#C1495A]">
                      <Ban size={10} /> Bloqué
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#9CA3AF]">Généré le</dt>
                <dd className="text-[#1B2A41]">
                  {qr.genereLe ? dayjs(qr.genereLe).format('DD/MM/YYYY HH:mm') : '—'}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="py-4 text-[12px] text-[#9CA3AF]">Aucun QR code actif</p>
        )}
      </div>
    </div>
  )
}
