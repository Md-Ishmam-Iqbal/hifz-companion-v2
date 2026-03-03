export type Range = {
  chapter: number
  verse: number
}

export type Ayah = {
  chapter: number
  verse: number
  text: string
}

export type ChapterVerseRef = {
  verse: number
}

export type ChapterMetadata = {
  chapter: number
  name: string
  englishname: string
  arabicname: string
  revelation: string
  verses: ChapterVerseRef[]
}

export type JuzReference = {
  juz: number
  start: Range
  end: Range
}

export type MetadataResponse = {
  chapters: ChapterMetadata[]
  juzs: {
    references: JuzReference[]
  }
}

export type QuranResponse = {
  quran: Ayah[]
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export function fetchMetadata(): Promise<MetadataResponse> {
  return fetchJson<MetadataResponse>(
    'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/info.json',
  )
}

export function fetchQuran(): Promise<QuranResponse> {
  return fetchJson<QuranResponse>(
    'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-qurandoorinonun.json',
  )
}

export function fetchInitialAyah(): Promise<Ayah> {
  return fetchJson<Ayah>(
    'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-qurandoorinonun/90/4.json',
  )
}
