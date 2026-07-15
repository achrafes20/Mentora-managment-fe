import { useEffect, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

interface ConfirmOptions {
  title: ReactNode
  content?: ReactNode
  okText?: string
  cancelText?: string
  danger?: boolean
  onOk: () => void | Promise<void>
}

let listener: ((opts: ConfirmOptions) => void) | null = null

/** Remplace `antd Modal.confirm({...})` — même forme d'appel imperative. */
export function confirm(options: ConfirmOptions) {
  listener?.(options)
}

export function ConfirmDialogHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listener = setOpts
    return () => {
      listener = null
    }
  }, [])

  async function handleOk() {
    if (!opts) return
    setLoading(true)
    try {
      await opts.onOk()
      setOpts(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={!!opts}
      onOpenChange={(open) => !open && setOpts(null)}
      title={opts?.title ?? ''}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpts(null)}>
            {opts?.cancelText ?? 'Annuler'}
          </Button>
          <Button
            variant={opts?.danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={handleOk}
          >
            {opts?.okText ?? 'Confirmer'}
          </Button>
        </>
      }
    >
      {opts?.content}
    </Dialog>
  )
}
