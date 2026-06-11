import { createContext, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppLanguage } from './types'
import { SUPPORTED_LANGUAGES } from './types'
import { dictionary } from './dictionary'

type TranslationCache = Map<string, string>

export type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: (key: string, params?: Record<string, string>) => string
  translateTexts: (texts: string[]) => Promise<string[]>
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'citizen-language'
// How many strings we send per OpenAI request, so a text-heavy page never
// blows the model's output-token budget.
const BATCH_SIZE = 40

// Reverse index of the curated dictionary, keyed by English source text. The
// core UI strings resolve from here instantly and reliably for every language —
// no OpenAI round-trip, and immune to the backend's batch length-mismatch
// failures that otherwise make some languages translate while others fall back
// to English. Built once at module load.
const DICT_BY_SOURCE = new Map<string, (typeof dictionary)[string]>()
for (const entry of Object.values(dictionary)) {
  if (entry.en) DICT_BY_SOURCE.set(entry.en.trim(), entry)
}

function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
    return stored as AppLanguage
  }
  return 'en'
}

function cacheStorageKey(lang: AppLanguage): string {
  return `i18n-cache-${lang}`
}

// Seed the in-memory cache from localStorage so repeat visits translate
// instantly (and for free). Stored as a { [sourceText]: translated } blob
// per language; keys in the live Map are prefixed `${lang}:${text}`.
function loadPersistedCache(cache: TranslationCache): void {
  if (typeof window === 'undefined') return
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === 'en') continue
    try {
      const raw = localStorage.getItem(cacheStorageKey(lang))
      if (!raw) continue
      const blob = JSON.parse(raw) as Record<string, string>
      for (const [text, translated] of Object.entries(blob)) {
        cache.set(`${lang}:${text}`, translated)
      }
    } catch {
      // Corrupt blob — ignore and let it be rebuilt on demand.
    }
  }
}

function persistCacheForLanguage(
  cache: TranslationCache,
  lang: AppLanguage,
): void {
  if (typeof window === 'undefined' || lang === 'en') return
  const prefix = `${lang}:`
  const blob: Record<string, string> = {}
  for (const [key, value] of cache) {
    if (key.startsWith(prefix)) blob[key.slice(prefix.length)] = value
  }
  try {
    localStorage.setItem(cacheStorageKey(lang), JSON.stringify(blob))
  } catch {
    // Quota exceeded or unavailable — the in-memory cache still works.
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage)
  // Lazy initializer runs once and seeds the in-memory cache from localStorage
  // so the first translation pass can resolve known strings without a request.
  // The Map identity is stable across renders.
  const [cache] = useState<TranslationCache>(() => {
    const map: TranslationCache = new Map()
    loadPersistedCache(map)
    return map
  })

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const entry = dictionary[key]
      if (!entry) return key
      let text = entry[language] ?? entry.en
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, v)
        }
      }
      return text
    },
    [language],
  )

  const translateTexts = useCallback(
    async (texts: string[]): Promise<string[]> => {
      if (language === 'en') return texts
      if (texts.length === 0) return texts

      const results: string[] = new Array(texts.length)
      const uncached: { index: number; text: string }[] = []

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i]
        if (!text) {
          results[i] = text
          continue
        }
        // Curated dictionary first: instant, free, and reliable for all four
        // languages regardless of OpenAI availability.
        const dict = DICT_BY_SOURCE.get(text.trim())
        if (dict?.[language]) {
          results[i] = dict[language]
          cache.set(`${language}:${text}`, dict[language])
          continue
        }

        const cacheKey = `${language}:${text}`
        const cached = cache.get(cacheKey)
        if (cached !== undefined) {
          results[i] = cached
        } else {
          uncached.push({ index: i, text })
          results[i] = text // fallback: keep English
        }
      }

      if (uncached.length === 0) {
        return results
      }

      // Chunk the uncached strings so one request never exceeds the model's
      // output budget, then fire all chunks in parallel — a sequential await
      // loop would create a request waterfall that makes switching feel frozen.
      const chunks: { index: number; text: string }[][] = []
      for (let start = 0; start < uncached.length; start += BATCH_SIZE) {
        chunks.push(uncached.slice(start, start + BATCH_SIZE))
      }

      // Returns true if the chunk produced any translations. Each chunk owns its
      // own try/catch so one failed request never sinks the others.
      const fetchChunk = async (
        chunk: { index: number; text: string }[],
      ): Promise<boolean> => {
        try {
          const response = await fetch('/api/ai/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetLanguage: language,
              texts: chunk.map((u) => u.text),
            }),
          })

          if (!response.ok) {
            console.warn(
              `[translate] ${response.status} ${response.statusText}`,
              await response.text().catch(() => ''),
            )
            return false
          }

          const data = (await response.json()) as { translations: string[] }

          for (let i = 0; i < chunk.length; i++) {
            const { index, text } = chunk[i]
            const translated = data.translations?.[i] ?? text
            results[index] = translated
            cache.set(`${language}:${text}`, translated)
          }
          return true
        } catch {
          // Silent fallback: keep English text for this chunk.
          return false
        }
      }

      const outcomes = await Promise.all(chunks.map(fetchChunk))
      if (outcomes.some(Boolean)) {
        persistCacheForLanguage(cache, language)
      }

      return results
    },
    [language, cache],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, translateTexts }),
    [language, setLanguage, t, translateTexts],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}
