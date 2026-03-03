export type ThemeId = 'desert' | 'library' | 'coast' | 'cedar'

export type ThemeOption = {
  id: ThemeId
  label: string
  bg: string
  border: string
  accent: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'desert',
    label: 'Desert Dawn',
    bg: '#fbf3e6',
    border: 'rgba(27, 36, 48, 0.20)',
    accent: '#cc5a2a',
  },
  {
    id: 'coast',
    label: 'Sea Glass',
    bg: '#f3fbff',
    border: 'rgba(15, 23, 42, 0.16)',
    accent: '#0e7490',
  },
  {
    id: 'library',
    label: 'Library Lamp',
    bg: '#090806',
    border: 'rgba(240, 195, 106, 0.40)',
    accent: '#f0c36a',
  },
  {
    id: 'cedar',
    label: 'Cedar Night',
    bg: '#090706',
    border: 'rgba(249, 115, 22, 0.42)',
    accent: '#f97316',
  },
]

const STORAGE_KEY = 'hifz-theme'

export function isThemeId(v: unknown): v is ThemeId {
  return v === 'desert' || v === 'library' || v === 'coast' || v === 'cedar'
}

export function getStoredTheme(): ThemeId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isThemeId(raw) ? raw : null
  } catch {
    return null
  }
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'library' || theme === 'cedar')
}

export function storeTheme(theme: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}
