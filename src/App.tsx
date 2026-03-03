import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import type { Ayah, ChapterMetadata, Range } from '@/api/quran'
import { fetchInitialAyah, fetchMetadata, fetchQuran } from '@/api/quran'
import LoadingSpinner from '@/components/LoadingSpinner'
import SelectRange from '@/components/SelectRange'
import ThemeSelect from '@/components/ThemeSelect'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export default function App() {
  const [randomAyah, setRandomAyah] = useState<Ayah>({ chapter: 0, verse: 0, text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(1024)
  const [surahMetaData, setSurahMetaData] = useState<ChapterMetadata>({
    chapter: 90,
    name: 'Al-Balad',
    englishname: 'The City',
    arabicname: 'سُوْرَةُ الْبَلَدِ',
    revelation: 'Mecca',
    verses: [],
  })
  const [toggleAnswerText, setToggleAnswerText] = useState('Reveal Answer')
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [startRange, setStartRange] = useState<Range>({ chapter: 78, verse: 1 })
  const [endRange, setEndRange] = useState<Range>({ chapter: 114, verse: 6 })

  const metadataResults = useQuery({ queryKey: ['metadata'], queryFn: fetchMetadata })
  const quranResults = useQuery({ queryKey: ['quran'], queryFn: fetchQuran })

  useEffect(() => {
    let cancelled = false

    async function getData() {
      setIsLoading(true)
      try {
        const ayah = await fetchInitialAyah()
        if (cancelled) return
        setRandomAyah(ayah)
      } catch {
        // keep existing state
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    getData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth || 1024)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const metaData = metadataResults.data
  const fullQuran = quranResults.data?.quran

  const handleRandomAyahRef = useRef<() => void>(() => {})

  const rangesText = useMemo(() => {
    return `${startRange.chapter}:${startRange.verse} - ${endRange.chapter}:${endRange.verse}`
  }, [startRange, endRange])

  function stripArabicMarks(s: string) {
    return s.replace(/[\u0610-\u061A\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  }

  function visibleLen(s: string) {
    return stripArabicMarks(s).length
  }

  function idealLineCount(totalVisible: number, vw: number) {
    // Rough capacity per line based on viewport width.
    const cap = vw < 420 ? 18 : vw < 640 ? 22 : vw < 900 ? 30 : vw < 1200 ? 38 : 46
    return Math.max(1, Math.min(12, Math.ceil(totalVisible / cap)))
  }

  function breakWordsIntoLines(words: string[], lineCount: number) {
    const n = words.length
    if (n === 0) return [] as string[]
    const L = Math.max(1, Math.min(lineCount, n))

    const widths = words.map((w) => Math.max(1, visibleLen(w)))
    const prefix: number[] = new Array(n + 1)
    prefix[0] = 0
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + widths[i]

    function lineWidth(i: number, j: number) {
      // words [i..j] inclusive
      const letters = prefix[j + 1] - prefix[i]
      const spaces = j - i
      return letters + spaces
    }

    const totalWidth = lineWidth(0, n - 1)
    const target = totalWidth / L
    const softMax = target * 1.5

    const dp: number[][] = Array.from({ length: L + 1 }, () => Array(n + 1).fill(Number.POSITIVE_INFINITY))
    const prev: number[][] = Array.from({ length: L + 1 }, () => Array(n + 1).fill(-1))
    dp[0][0] = 0

    for (let l = 1; l <= L; l++) {
      for (let j = 1; j <= n; j++) {
        for (let i = l - 1; i <= j - 1; i++) {
          const w = lineWidth(i, j - 1)
          const maxAllowed = l === L ? softMax * 2.0 : softMax
          if (w > maxAllowed) continue

          const penaltyWeight = l === L ? 0.22 : 1
          const cost = dp[l - 1][i] + Math.pow(target - w, 2) * penaltyWeight
          if (cost < dp[l][j]) {
            dp[l][j] = cost
            prev[l][j] = i
          }
        }
      }
    }

    // Backtrack from the best solution ending at n.
    let bestL = L
    while (bestL > 1 && prev[bestL][n] === -1) bestL--

    const lines: string[] = []
    let j = n
    for (let l = bestL; l >= 1; l--) {
      const i = prev[l][j]
      const start = i === -1 ? 0 : i
      lines.push(words.slice(start, j).join(' '))
      j = start
    }
    lines.reverse()
    return lines
  }

  const ayahLayout = useMemo(() => {
    const text = (randomAyah.text || '').trim()
    const words = text.split(/\s+/).filter(Boolean)
    const totalVisible = visibleLen(text)

    const lines = breakWordsIntoLines(words, idealLineCount(totalVisible, viewportWidth))

    // Use explicit gaps between lines to avoid diacritic collisions.
    if (totalVisible > 320) {
      return {
        sizeClass: 'text-2xl sm:text-3xl lg:text-4xl',
        gapClass: 'gap-[1.95em] sm:gap-[2.05em]',
        style: { wordSpacing: '0.18em' } as React.CSSProperties,
        lines,
      }
    }

    if (totalVisible > 220) {
      return {
        sizeClass: 'text-3xl sm:text-4xl lg:text-5xl',
        gapClass: 'gap-[1.7em] sm:gap-[1.85em]',
        style: { wordSpacing: '0.17em' } as React.CSSProperties,
        lines,
      }
    }

    if (totalVisible > 140) {
      return {
        sizeClass: 'text-4xl sm:text-5xl lg:text-6xl',
        gapClass: 'gap-[1.35em] sm:gap-[1.5em]',
        style: { wordSpacing: '0.16em' } as React.CSSProperties,
        lines,
      }
    }

    return {
      sizeClass: 'text-5xl sm:text-6xl lg:text-7xl',
      gapClass: 'gap-[1.15em] sm:gap-[1.25em]',
      style: { wordSpacing: '0.14em' } as React.CSSProperties,
      lines,
    }
  }, [randomAyah.text, viewportWidth])

  function updateStartRange(next: Range) {
    setStartRange(next)
  }

  function updateEndRange(next: Range) {
    setEndRange(next)
  }

  function displayAnswer() {
    if (!metaData) return
    const currentChapter = metaData.chapters.find((c) => c.chapter === randomAyah.chapter)
    if (currentChapter) setSurahMetaData(currentChapter)
  }

  function displayAnswerForAyah(ayah: Ayah) {
    if (!metaData) return
    const currentChapter = metaData.chapters.find((c) => c.chapter === ayah.chapter)
    if (currentChapter) setSurahMetaData(currentChapter)
  }

  function revealAnswer() {
    setIsAnswerRevealed(true)
    setToggleAnswerText('Hide answer')
  }

  function hideAnswer() {
    setIsAnswerRevealed(false)
    setToggleAnswerText('Reveal answer')
  }

  function handleToggleAnswer() {
    displayAnswer()
    if (!isAnswerRevealed) revealAnswer()
    else hideAnswer()
  }

  function handleRandomAyah() {
    if (!fullQuran) return
    hideAnswer()

    const startChapterIndex = fullQuran.findIndex(
      (obj) => obj.chapter === startRange.chapter && obj.verse === startRange.verse,
    )
    const endChapterIndex = fullQuran.findIndex(
      (obj) => obj.chapter === endRange.chapter && obj.verse === endRange.verse,
    )

    const randomAyahIndex = randomInRange(startChapterIndex, endChapterIndex)
    const nextAyah = fullQuran[randomAyahIndex]
    if (nextAyah) setRandomAyah({ ...nextAyah })
  }

  handleRandomAyahRef.current = handleRandomAyah

  useEffect(() => {
    if (!fullQuran) return

    const INACTIVITY_MS = 5 * 60 * 1000
    let t: ReturnType<typeof window.setTimeout> | null = null

    const schedule = () => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => {
        // If the tab isn't visible, don't auto-advance.
        if (document.hidden) {
          schedule()
          return
        }

        handleRandomAyahRef.current()
        schedule()
      }, INACTIVITY_MS)
    }

    const onActivity = () => schedule()

    schedule()

    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('pointermove', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    window.addEventListener('touchstart', onActivity, { passive: true })
    window.addEventListener('wheel', onActivity, { passive: true })
    window.addEventListener('scroll', onActivity, { passive: true })
    document.addEventListener('visibilitychange', onActivity)

    return () => {
      if (t) window.clearTimeout(t)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('pointermove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('wheel', onActivity)
      window.removeEventListener('scroll', onActivity)
      document.removeEventListener('visibilitychange', onActivity)
    }
  }, [fullQuran])

  function handlePrevAyah() {
    if (!fullQuran) return
    const currentAyah = randomAyah
    const currentSurah = fullQuran.filter((s) => s.chapter === currentAyah.chapter)

    if (currentAyah.verse > 1) {
      const previousVerse = currentAyah.verse - 1
      const previousAyah = currentSurah.find((s) => s.verse === previousVerse)
      if (previousAyah) {
        setRandomAyah({ ...previousAyah })
        if (isAnswerRevealed) displayAnswerForAyah(previousAyah)
      }
      return
    }

    const previousChapter = currentAyah.chapter - 1
    const previousSurah = fullQuran.filter((s) => s.chapter === previousChapter)
    const previousAyah = previousSurah[previousSurah.length - 1]
    if (previousAyah) {
      setRandomAyah(previousAyah)
      if (isAnswerRevealed) displayAnswerForAyah(previousAyah)
    }
    else setRandomAyah(currentAyah)
  }

  function handleNextAyah() {
    if (!fullQuran) return
    const currentAyah = randomAyah
    const currentSurah = fullQuran.filter((s) => s.chapter === currentAyah.chapter)
    const lastAyah = currentSurah[currentSurah.length - 1]

    if (lastAyah && currentAyah.verse < lastAyah.verse) {
      const nextVerse = currentAyah.verse + 1
      const nextAyah = currentSurah.find((s) => s.verse === nextVerse)
      if (nextAyah) {
        setRandomAyah(nextAyah)
        if (isAnswerRevealed) displayAnswerForAyah(nextAyah)
      }
      return
    }

    const nextChapter = currentAyah.chapter + 1
    const nextSurah = fullQuran.filter((s) => s.chapter === nextChapter)
    const nextAyah = nextSurah[0]
    if (nextAyah) {
      setRandomAyah(nextAyah)
      if (isAnswerRevealed) displayAnswerForAyah(nextAyah)
    }
    else setRandomAyah(currentAyah)
  }

  const controlsMotionClass = 'opacity-100'

  function ControlsCenterDock() {
    return (
      <div className={cn('mx-auto w-full max-w-5xl transition-all duration-200', controlsMotionClass)}>
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Button
                variant="ghost"
                className="h-12 rounded-lg text-base text-foreground shadow-none hover:translate-y-0 hover:bg-background/35 hover:text-foreground hover:shadow-none"
                onClick={handlePrevAyah}
              >
                <ChevronLeft className="h-4 w-4" />
                previous
              </Button>

              <Button
                className="col-span-2 h-12 rounded-lg text-base shadow-none hover:translate-y-0 hover:shadow-none sm:col-span-1"
                onClick={handleRandomAyah}
              >
                <Sparkles className="h-4 w-4" />
                Random ayah
              </Button>

              <Button
                variant="ghost"
                className="h-12 rounded-lg text-base text-foreground shadow-none hover:translate-y-0 hover:bg-background/35 hover:text-foreground hover:shadow-none"
                onClick={handleNextAyah}
              >
                next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (quranResults.isLoading || metadataResults.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (quranResults.isError || metadataResults.isError || !metaData || !fullQuran) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Failed to load Quran data.
      </div>
    )
  }

  return (
    <main>
      <div className="h-[100dvh] text-[calc(12px+1.2vmin)] text-foreground">
        <div className="mx-auto grid h-full max-w-[96rem] grid-rows-[auto_auto_1fr] gap-6 px-4 py-8 sm:px-6">
          <header className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="text-center sm:col-start-2 sm:row-start-1">
                <div
                  className="text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hifz Companion
                </div>
                <div className="mt-2 text-base text-muted-foreground sm:text-lg">
                  Calm practice: recite first, then reveal the answer.
                </div>

              </div>
              <div className="flex justify-center sm:col-start-3 sm:row-start-1 sm:justify-end">
                <ThemeSelect />
              </div>

              <div className="flex justify-center sm:col-span-3 sm:row-start-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <SelectRange
                    metadata={metaData}
                    startRange={startRange}
                    endRange={endRange}
                    updateStartRange={updateStartRange}
                    updateEndRange={updateEndRange}
                  />
                  <Badge className="px-3 py-1 text-xs sm:text-sm" variant="secondary">
                    {rangesText}
                  </Badge>
                </div>
              </div>
            </div>
          </header>

          <div className="pt-6">
            <ControlsCenterDock />
          </div>

          <section className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="mx-auto w-full max-w-[96rem] pb-24 pt-8">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div
                    key={`${randomAyah.chapter}:${randomAyah.verse}`}
                    className={cn(
                      'transition-[opacity,transform] duration-300',
                      'animate-[hcAyahEnter_520ms_cubic-bezier(0.16,1,0.3,1)]',
                      'mx-auto',
                      ayahLayout.sizeClass,
                    )}
                    style={{ fontFamily: 'var(--font-arabic)', ...ayahLayout.style }}
                    lang="ar"
                    dir="rtl"
                  >
                    <div
                      className={cn(
                        'mx-auto flex max-w-full flex-col items-center text-center leading-[1.25]',
                        ayahLayout.gapClass,
                      )}
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {ayahLayout.lines.map((line, idx) => (
                        <div key={idx} className="max-w-full px-2">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-14 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleToggleAnswer}
                      className={cn(
                        'text-base font-medium text-primary underline decoration-primary/40 underline-offset-8 transition-colors',
                        'hover:text-primary/90 hover:decoration-primary/80',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                    >
                      {toggleAnswerText}
                    </button>

                    <div className="mt-7 w-full max-w-3xl text-center">
                      <div
                        className={cn(
                          'mx-auto h-px w-full max-w-xl origin-center bg-border transition-[transform,opacity] duration-500',
                          isAnswerRevealed ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
                        )}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                      />

                      <div
                        className={cn(
                          'mt-5 text-2xl font-semibold tracking-tight transition-[transform,opacity] duration-500',
                          isAnswerRevealed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                        )}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                      >
                        {`${surahMetaData.name} [${randomAyah.chapter}:${randomAyah.verse}]`}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
