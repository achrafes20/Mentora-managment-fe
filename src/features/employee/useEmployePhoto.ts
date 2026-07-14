import { useEffect, useState } from 'react'
import { chargerPhotoEmploye } from '@/features/employee/employesApi'

/** Charge la photo employé via l'API authentifiée et retourne une URL blob. */
export function useEmployePhotoUrl(
  employeId: string | undefined,
  photoFichierId: string | undefined | null,
) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!employeId || !photoFichierId) {
      setUrl(null)
      return
    }

    let actif = true
    let blobUrl: string | null = null

    chargerPhotoEmploye(employeId)
      .then((objectUrl) => {
        if (actif) {
          blobUrl = objectUrl
          setUrl(objectUrl)
        } else {
          URL.revokeObjectURL(objectUrl)
        }
      })
      .catch(() => {
        if (actif) setUrl(null)
      })

    return () => {
      actif = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [employeId, photoFichierId])

  return url
}
