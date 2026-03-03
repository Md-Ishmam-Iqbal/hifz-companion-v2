import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari legacy
    Boolean(window.navigator.standalone)
  )
}

export default function InstallPwaButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  // If the browser doesn't provide an install prompt (common on iOS, and sometimes on desktop),
  // we still show a small "Install" entry that explains where to find it.
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn('w-full shadow-none hover:translate-y-0 hover:shadow-none', className)}
          onClick={async (e) => {
            if (!deferred) return

            // Use the same button click for the real prompt when available.
            e.preventDefault()
            try {
              await deferred.prompt()
              await deferred.userChoice
            } finally {
              setDeferred(null)
            }
          }}
        >
          <Download className="h-4 w-4" />
          Install
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(92vw,420px)]">
        <DialogHeader>
          <DialogTitle>Install Hifz Companion</DialogTitle>
          <DialogDescription>
            {isIos()
              ? 'On iPhone/iPad: use Safari Share, then Add to Home Screen.'
              : 'Use your browser menu (or address bar icon) to install this app.'}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          {isIos()
            ? 'Safari → Share → Add to Home Screen'
            : 'Chrome/Edge → Menu → Install app / Add to Home screen'}
        </div>
      </DialogContent>
    </Dialog>
  )
}
