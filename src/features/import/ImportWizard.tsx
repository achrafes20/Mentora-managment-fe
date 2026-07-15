import { useRef, useState } from 'react'
import { Upload, RotateCcw } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/toast'
import { RapportTable } from './RapportTable'
import { useAnalyserImport, useExecuterImport, usePrevisualiserImport } from './useImport'
import type { ImportApercu, ImportCible, ImportRapport } from './importApi'

const CIBLES: { value: ImportCible; label: string }[] = [
  { value: 'DEPARTEMENTS', label: 'Départements' },
  { value: 'EMPLOYES', label: 'Employés' },
  { value: 'SOLDES_CONGES_INITIAUX', label: 'Soldes de congés initiaux' },
]

type Etape = 'upload' | 'mapping' | 'rapport'

export function ImportWizard() {
  const [cible, setCible] = useState<ImportCible>('DEPARTEMENTS')
  const [etape, setEtape] = useState<Etape>('upload')
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState<ImportApercu | null>(null)
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [rapport, setRapport] = useState<ImportRapport | null>(null)
  const [rapportEstReel, setRapportEstReel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const previsualiser = usePrevisualiserImport()
  const analyser = useAnalyserImport()
  const executer = useExecuterImport()

  function reinitialiser() {
    setEtape('upload')
    setFichier(null)
    setApercu(null)
    setMapping({})
    setRapport(null)
    setRapportEstReel(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function changerCible(valeur: string) {
    setCible(valeur as ImportCible)
    reinitialiser()
  }

  function selectionnerFichier(fichierChoisi: File) {
    setFichier(fichierChoisi)
    previsualiser.mutate(
      { fichier: fichierChoisi, cible },
      {
        onSuccess: (data) => {
          setApercu(data)
          setMapping(data.mappingSuggere ?? {})
          setEtape('mapping')
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  function lancerSimulation() {
    if (!fichier) return
    analyser.mutate(
      { fichier, cible, mapping },
      {
        onSuccess: (data) => {
          setRapport(data)
          setRapportEstReel(false)
          setEtape('rapport')
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  function confirmerImport() {
    if (!fichier) return
    executer.mutate(
      { fichier, cible, mapping },
      {
        onSuccess: (data) => {
          setRapport(data)
          setRapportEstReel(true)
          toast.success(`Import terminé : ${data.lignesValides} ligne(s) traitée(s).`)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const champsManquants =
    apercu?.champsCible?.filter((c) => c.requis && mapping[c.cle ?? ''] === undefined) ?? []

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[12px] font-medium text-[#1B2A41]">Cible de l'import</span>
        <div className="w-64">
          <Select
            value={cible}
            onChange={changerCible}
            options={CIBLES}
            disabled={etape !== 'upload'}
          />
        </div>
        {etape !== 'upload' && (
          <Button variant="secondary" onClick={reinitialiser}>
            <RotateCcw size={14} />
            Recommencer
          </Button>
        )}
      </div>

      {etape === 'upload' && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const fichierDepose = e.dataTransfer.files[0]
            if (fichierDepose) selectionnerFichier(fichierDepose)
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D4CC] bg-white p-12 transition-colors hover:border-[#1B2A41]"
        >
          <Upload size={32} className="mb-3 text-[#9CA3AF]" />
          <p className="text-[14px] font-medium text-[#1B2A41]">
            {previsualiser.isPending ? 'Analyse du fichier…' : 'Glisser-déposer un fichier'}
          </p>
          <p className="mt-1 text-[12px] text-[#9CA3AF]">Formats acceptés : .xlsx, .xls, .csv</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const fichierChoisi = e.target.files?.[0]
              if (fichierChoisi) selectionnerFichier(fichierChoisi)
            }}
          />
        </div>
      )}

      {etape === 'mapping' && apercu && (
        <div>
          <p className="mb-4 text-[13px] text-[#6B7280]">
            {apercu.totalLignes} ligne(s) détectée(s) dans <strong>{fichier?.name}</strong>. Faites
            correspondre les colonnes du fichier aux champs attendus ci-dessous.
          </p>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {apercu.champsCible?.map((champ) => (
              <ChampMapping
                key={champ.cle}
                champ={champ}
                entetes={apercu.entetes ?? []}
                valeur={mapping[champ.cle ?? '']}
                onChange={(colonne) =>
                  setMapping((m) => {
                    const suivant = { ...m }
                    if (colonne === undefined) delete suivant[champ.cle ?? '']
                    else suivant[champ.cle ?? ''] = colonne
                    return suivant
                  })
                }
              />
            ))}
          </div>

          {apercu.apercuLignes && apercu.apercuLignes.length > 0 && (
            <div className="mb-5 overflow-x-auto rounded-xl border border-[#D8D4CC] bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D8D4CC] bg-[#F7F7F4]">
                    {apercu.entetes?.map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase"
                      >
                        {h || `Colonne ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apercu.apercuLignes.slice(0, 5).map((ligne, i) => (
                    <tr key={i} className="border-b border-[#D8D4CC]/50">
                      {ligne.map((valeur, j) => (
                        <td key={j} className="px-4 py-2 text-[12px] text-[#1B2A41]">
                          {valeur}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {champsManquants.length > 0 && (
            <Alert
              message={`Champs requis non mappés : ${champsManquants.map((c) => c.libelle).join(', ')}`}
            />
          )}

          <Button
            onClick={lancerSimulation}
            loading={analyser.isPending}
            disabled={champsManquants.length > 0}
          >
            Lancer la simulation (dry-run)
          </Button>
        </div>
      )}

      {etape === 'rapport' && rapport && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-[#D8D4CC] bg-white p-4">
            <ResumeStat label="Lignes analysées" value={rapport.totalLignes ?? 0} />
            <ResumeStat label="Valides" value={rapport.lignesValides ?? 0} accent="#4A7C6B" />
            <ResumeStat label="Erreurs" value={rapport.lignesErreur ?? 0} accent="#C1495A" />
          </div>

          <div className="mb-4">
            <RapportTable lignes={rapport.lignes ?? []} />
          </div>

          {!rapportEstReel ? (
            <div className="flex items-center gap-2">
              <Button onClick={confirmerImport} variant="success" loading={executer.isPending}>
                Confirmer et importer réellement
              </Button>
              <Button variant="secondary" onClick={reinitialiser}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#4A7C6B]/30 bg-[#4A7C6B]/6 p-4">
              <p className="mb-3 text-[13px] font-medium text-[#4A7C6B]">
                Import réel terminé : {rapport.lignesValides} ligne(s) traitée(s),{' '}
                {rapport.lignesErreur} ligne(s) en erreur.
              </p>
              <Button onClick={reinitialiser}>Nouvel import</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChampMapping({
  champ,
  entetes,
  valeur,
  onChange,
}: {
  champ: { cle?: string; libelle?: string; requis?: boolean }
  entetes: string[]
  valeur: number | undefined
  onChange: (colonne: number | undefined) => void
}) {
  const options = [
    ...(champ.requis ? [] : [{ value: '__aucun__', label: 'Ne pas importer ce champ' }]),
    ...entetes.map((h, i) => ({ value: i.toString(), label: h || `Colonne ${i + 1}` })),
  ]
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#1B2A41]">
        {champ.libelle}
        {champ.requis && <span className="text-[#C1495A]"> *</span>}
      </label>
      <Select
        value={valeur !== undefined ? valeur.toString() : undefined}
        onChange={(v) => onChange(v === '__aucun__' ? undefined : Number(v))}
        options={options}
        placeholder="Non mappé"
      />
    </div>
  )
}

function ResumeStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-[#9CA3AF] uppercase">{label}</p>
      <p
        className="text-[20px] font-semibold"
        style={{ color: accent ?? '#1B2A41', fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
    </div>
  )
}
