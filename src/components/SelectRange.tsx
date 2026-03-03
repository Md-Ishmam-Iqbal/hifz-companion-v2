import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import type { ChapterMetadata, ChapterVerseRef, MetadataResponse, Range } from '@/api/quran'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  metadata: MetadataResponse
  startRange: Range
  endRange: Range
  updateStartRange: (start: Range) => void
  updateEndRange: (end: Range) => void
}

type Scope = 'juz' | 'single_surah' | 'surah_range' | 'custom'

export default function SelectRange({
  metadata,
  startRange,
  endRange,
  updateStartRange,
  updateEndRange,
}: Props) {
  const [open, setOpen] = useState(false)

  const [scope, setScope] = useState<Scope>('juz')
  const [draftStart, setDraftStart] = useState<Range>(startRange)
  const [draftEnd, setDraftEnd] = useState<Range>(endRange)
  const [draftJuz, setDraftJuz] = useState<string>('')
  const [error, setError] = useState<string>('')

  const chapters = metadata.chapters
  const juzs = metadata.juzs.references

  const chapterByNumber = useMemo(() => {
    const map = new Map<number, ChapterMetadata>()
    for (const c of chapters) map.set(c.chapter, c)
    return map
  }, [chapters])

  function lastVerse(chapterNum: number) {
    const chapter = chapterByNumber.get(chapterNum)
    const verses = chapter?.verses
    const last = verses && verses.length ? verses[verses.length - 1]?.verse : undefined
    return typeof last === 'number' ? last : verses?.length ?? 1
  }

  function rangeIsValid(a: Range, b: Range) {
    if (a.chapter < b.chapter) return true
    if (a.chapter > b.chapter) return false
    return a.verse <= b.verse
  }

  const startVerseList: ChapterVerseRef[] = useMemo(() => {
    return chapterByNumber.get(draftStart.chapter)?.verses ?? []
  }, [chapterByNumber, draftStart.chapter])

  const endVerseList: ChapterVerseRef[] = useMemo(() => {
    return chapterByNumber.get(draftEnd.chapter)?.verses ?? []
  }, [chapterByNumber, draftEnd.chapter])

  useEffect(() => {
    if (!open) return

    // initialize draft from current props
    setDraftStart(startRange)
    setDraftEnd(endRange)
    setError('')

    // default scope: Juz
    const matchedJuz = juzs.find(
      (j) =>
        j.start.chapter === startRange.chapter &&
        j.start.verse === startRange.verse &&
        j.end.chapter === endRange.chapter &&
        j.end.verse === endRange.verse,
    )
    setScope('juz')
    setDraftJuz(matchedJuz ? String(matchedJuz.juz) : '')
  }, [open, endRange, juzs, startRange, chapterByNumber])

  useEffect(() => {
    if (!open) return
    if (scope === 'juz') {
      setError('')
      return
    }
    if (!rangeIsValid(draftStart, draftEnd)) {
      setError('Start must be before end.')
    } else {
      setError('')
    }
  }, [draftEnd, draftStart, open, scope])

  const chapterItems = useMemo(() => {
    return chapters.map((chapter) => (
      <SelectItem key={chapter.chapter} value={String(chapter.chapter)}>
        {chapter.chapter} — {chapter.name}
      </SelectItem>
    ))
  }, [chapters])

  function applyAndClose() {
    if (scope !== 'juz' && error) return
    updateStartRange(draftStart)
    updateEndRange(draftEnd)
    setOpen(false)
  }

  function cancelAndClose() {
    setOpen(false)
  }

  function handleStartRangeChapter(value: string) {
    const nextChapter = Number(value)
    if (Number.isNaN(nextChapter)) return

    if (scope === 'single_surah') {
      setDraftStart({ chapter: nextChapter, verse: 1 })
      setDraftEnd({ chapter: nextChapter, verse: lastVerse(nextChapter) })
      return
    }

    if (scope === 'surah_range') {
      setDraftStart({ chapter: nextChapter, verse: 1 })
      setDraftEnd((prev) => ({ chapter: prev.chapter, verse: lastVerse(prev.chapter) }))
      return
    }

    // custom
    setDraftStart({ chapter: nextChapter, verse: 1 })
  }

  function handleEndRangeChapter(value: string) {
    const nextChapter = Number(value)
    if (Number.isNaN(nextChapter)) return

    if (scope === 'surah_range') {
      setDraftEnd({ chapter: nextChapter, verse: lastVerse(nextChapter) })
      return
    }

    // custom
    setDraftEnd({ chapter: nextChapter, verse: 1 })
  }

  function handleSelectStartRangeAyah(value: string) {
    const nextVerse = Number(value)
    if (Number.isNaN(nextVerse)) return
    setDraftStart({ ...draftStart, verse: nextVerse })
  }

  function handleSelectEndRangeAyah(value: string) {
    const nextVerse = Number(value)
    if (Number.isNaN(nextVerse)) return
    setDraftEnd({ ...draftEnd, verse: nextVerse })
  }

  function handleSelectJuz(value: string) {
    const nextJuz = Number(value)
    if (Number.isNaN(nextJuz)) return

    const juzObject = juzs.filter((j) => j.juz === nextJuz)[0]
    if (!juzObject) return

    setDraftStart(juzObject.start)
    setDraftEnd(juzObject.end)
    setDraftJuz(String(juzObject.juz))
  }

  function setScopeAndNormalize(nextScope: Scope) {
    setScope(nextScope)
    setError('')

    if (nextScope === 'juz') return

    if (nextScope === 'single_surah') {
      const chapter = draftStart.chapter
      setDraftStart({ chapter, verse: 1 })
      setDraftEnd({ chapter, verse: lastVerse(chapter) })
      return
    }

    if (nextScope === 'surah_range') {
      setDraftStart({ chapter: draftStart.chapter, verse: 1 })
      setDraftEnd({ chapter: draftEnd.chapter, verse: lastVerse(draftEnd.chapter) })
      return
    }
  }

  return (
    <div className="w-fit">
      <Button
        variant="outline"
        className="h-9 gap-2 rounded-full border-border/60 bg-background/40 px-3 text-sm shadow-none hover:translate-y-0 hover:border-ring hover:bg-primary/10 hover:text-foreground hover:shadow-none sm:h-11 sm:px-4"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Select range
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Choose a scope</DialogTitle>
            <DialogDescription>
              Pick a scope first, then fine-tune the range.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background/20 p-1 sm:grid-cols-4">
            <Button
              type="button"
              variant="ghost"
              className={
                scope === 'juz'
                  ? 'h-9 justify-center rounded-lg bg-primary text-primary-foreground shadow-none hover:translate-y-0 hover:bg-primary/90 hover:shadow-none'
                  : 'h-9 justify-center rounded-lg shadow-none hover:translate-y-0 hover:bg-muted hover:text-foreground hover:shadow-none dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
              onClick={() => setScopeAndNormalize('juz')}
            >
              Juz
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={
                scope === 'single_surah'
                  ? 'h-9 justify-center rounded-lg bg-primary text-primary-foreground shadow-none hover:translate-y-0 hover:bg-primary/90 hover:shadow-none'
                  : 'h-9 justify-center rounded-lg shadow-none hover:translate-y-0 hover:bg-muted hover:text-foreground hover:shadow-none dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
              onClick={() => setScopeAndNormalize('single_surah')}
            >
              Single surah
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={
                scope === 'surah_range'
                  ? 'h-9 justify-center rounded-lg bg-primary text-primary-foreground shadow-none hover:translate-y-0 hover:bg-primary/90 hover:shadow-none'
                  : 'h-9 justify-center rounded-lg shadow-none hover:translate-y-0 hover:bg-muted hover:text-foreground hover:shadow-none dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
              onClick={() => setScopeAndNormalize('surah_range')}
            >
              Surah range
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={
                scope === 'custom'
                  ? 'h-9 justify-center rounded-lg bg-primary text-primary-foreground shadow-none hover:translate-y-0 hover:bg-primary/90 hover:shadow-none'
                  : 'h-9 justify-center rounded-lg shadow-none hover:translate-y-0 hover:bg-muted hover:text-foreground hover:shadow-none dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
              onClick={() => setScopeAndNormalize('custom')}
            >
              Verse range
            </Button>
          </div>

          {scope === 'juz' && (
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Select Juz</div>
              <Select value={draftJuz} onValueChange={handleSelectJuz}>
                <SelectTrigger>
                  <SelectValue placeholder="Juz" />
                </SelectTrigger>
                <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                  {juzs.map((j) => (
                    <SelectItem key={j.juz} value={String(j.juz)}>
                      Juz {j.juz} ({j.start.chapter}:{j.start.verse} - {j.end.chapter}:{j.end.verse})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!draftJuz && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Choose a juz to apply. (Current range stays unchanged until you click Apply.)
                </div>
              )}
            </div>
          )}

          {scope === 'single_surah' && (
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Surah</div>
              <Select value={String(draftStart.chapter)} onValueChange={handleStartRangeChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="Surah" />
                </SelectTrigger>
                <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                  {chapterItems}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === 'surah_range' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="mb-2 text-xs text-muted-foreground">Start (Surah)</div>
                <Select value={String(draftStart.chapter)} onValueChange={handleStartRangeChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                    {chapterItems}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="mb-2 text-xs text-muted-foreground">End (Surah)</div>
                <Select value={String(draftEnd.chapter)} onValueChange={handleEndRangeChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                    {chapterItems}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {scope === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Start (Surah)</div>
                <Select value={String(draftStart.chapter)} onValueChange={handleStartRangeChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                    {chapterItems}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Start (Ayah)</div>
                <Select value={String(draftStart.verse)} onValueChange={handleSelectStartRangeAyah}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ayah" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '175px' }}>
                    {startVerseList.map((ayah) => (
                      <SelectItem key={ayah.verse} value={String(ayah.verse)}>
                        {ayah.verse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">End (Surah)</div>
                <Select value={String(draftEnd.chapter)} onValueChange={handleEndRangeChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '300px' }}>
                    {chapterItems}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">End (Ayah)</div>
                <Select value={String(draftEnd.verse)} onValueChange={handleSelectEndRangeAyah}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ayah" />
                  </SelectTrigger>
                  <SelectContent style={{ ['--select-max-height' as never]: '175px' }}>
                    {endVerseList.map((ayah) => (
                      <SelectItem key={ayah.verse} value={String(ayah.verse)}>
                        {ayah.verse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              variant="secondary"
              className="shadow-none hover:translate-y-0 hover:shadow-none"
              onClick={cancelAndClose}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="shadow-none hover:translate-y-0 hover:shadow-none"
              disabled={scope !== 'juz' && Boolean(error)}
              onClick={applyAndClose}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
