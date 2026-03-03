import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari legacy
    Boolean(window.navigator.standalone)
  )
}

type Props = {
  className?: string
  ui?: 'full' | 'header'
}

export default function InstallPwaButton({ className, ui = 'full' }: Props) {
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

  // Only show an install button when the browser provides an install prompt.
  if (!deferred) return null

  const isHeader = ui === 'header'
  const buttonProps = isHeader
    ? {
        variant: 'outline' as const,
        size: 'icon' as const,
        className: cn(
          'h-9 w-9 rounded-full border-border/60 bg-background/40 shadow-none',
          'hover:translate-y-0 hover:border-ring hover:bg-accent hover:text-accent-foreground hover:shadow-none',
          className,
        ),
        children: <Download className="h-4 w-4" />,
        'aria-label': 'Install app',
      }
    : {
        variant: 'secondary' as const,
        className: cn('w-full shadow-none hover:translate-y-0 hover:shadow-none', className),
        children: (
          <>
            <Download className="h-4 w-4" />
            Install
          </>
        ),
      }

  return (
    <Button
      type="button"
      {...buttonProps}
      onClick={async () => {
        try {
          await deferred.prompt()
          await deferred.userChoice
        } finally {
          setDeferred(null)
        }
      }}
    />
  )
}
