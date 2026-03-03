export type ThemeId = 'desert' | 'library' | 'coast' | 'cedar'

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
