import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

  const showIosHint = useMemo(() => isIos() && !isStandalone(), [])

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

  if (deferred) {
    return (
      <Button
        type="button"
        variant="secondary"
        className={cn('w-full shadow-none hover:translate-y-0 hover:shadow-none', className)}
        onClick={async () => {
          try {
            await deferred.prompt()
            await deferred.userChoice
          } finally {
            setDeferred(null)
          }
        }}
      >
        <Download className="h-4 w-4" />
        Install app
      </Button>
    )
  }

  if (showIosHint) {
    return (
      <div className={cn('rounded-xl border border-border/60 bg-background/35 px-3 py-2 text-xs text-muted-foreground', className)}>
        Install: Share → Add to Home Screen
      </div>
    )
  }

  return null
}
