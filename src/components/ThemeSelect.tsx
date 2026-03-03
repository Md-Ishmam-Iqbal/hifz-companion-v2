import { useEffect, useState } from 'react'

import { THEME_OPTIONS, applyTheme, getStoredTheme, storeTheme, type ThemeId } from '@/lib/theme'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Props = {
  variant?: 'select' | 'grid'
}

export default function ThemeSelect({ variant = 'select' }: Props) {
  const [theme, setTheme] = useState<ThemeId>('desert')

  const selected = THEME_OPTIONS.find((t) => t.id === theme) ?? THEME_OPTIONS[0]

  useEffect(() => {
    const fromStorage = getStoredTheme()
    const fromDom = document.documentElement.dataset.theme
    const next: ThemeId =
      fromStorage ??
      (fromDom === 'desert' || fromDom === 'library' || fromDom === 'coast' || fromDom === 'cedar'
        ? fromDom
        : 'desert')
    setTheme(next)
    applyTheme(next)
  }, [])

  function onChange(value: string) {
    const next = (value === 'desert' || value === 'library' || value === 'coast' || value === 'cedar'
      ? value
      : 'desert') as ThemeId
    setTheme(next)
    applyTheme(next)
    storeTheme(next)
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {THEME_OPTIONS.map((t) => {
          const isSelected = t.id === theme
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors',
                'bg-background/40 hover:bg-background/55',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected ? 'border-ring' : 'border-border/60',
              )}
            >
              <span
                className={cn(
                  'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-ring bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background/30 text-muted-foreground',
                )}
              >
                <Check className={cn('h-4 w-4 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')} />
              </span>

              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'relative h-9 w-9 shrink-0 rounded-full border',
                    isSelected ? 'border-ring' : 'border-border/70',
                  )}
                  style={{ background: t.bg }}
                >
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border border-background"
                    style={{ background: t.accent }}
                  />
                </span>
              </span>

              <span className="pr-7">
                <span className="block whitespace-normal text-sm font-medium leading-tight">{t.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-[190px] sm:w-[220px]">
      <Select value={theme} onValueChange={onChange}>
        <SelectTrigger className="h-11 border-border/60 bg-background/40 text-sm">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: selected.bg, border: `1px solid ${selected.border}` }}
            />
            <span>{selected.label}</span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {THEME_OPTIONS.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: t.bg, border: `1px solid ${t.border}` }}
                />
                <span>{t.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
