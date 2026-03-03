import { useEffect, useState } from 'react'

import { applyTheme, getStoredTheme, storeTheme, type ThemeId } from '@/lib/theme'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

const THEMES: Array<{ id: ThemeId; label: string; bg: string; border: string }> = [
  { id: 'desert', label: 'Desert Dawn', bg: '#fbf3e6', border: 'rgba(27, 36, 48, 0.20)' },
  { id: 'coast', label: 'Sea Glass', bg: '#f3fbff', border: 'rgba(15, 23, 42, 0.16)' },
  { id: 'library', label: 'Library Lamp', bg: '#090806', border: 'rgba(240, 195, 106, 0.40)' },
  { id: 'cedar', label: 'Cedar Night', bg: '#090706', border: 'rgba(249, 115, 22, 0.42)' },
]

export default function ThemeSelect() {
  const [theme, setTheme] = useState<ThemeId>('desert')

  const selected = THEMES.find((t) => t.id === theme) ?? THEMES[0]

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
          {THEMES.map((t) => (
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
