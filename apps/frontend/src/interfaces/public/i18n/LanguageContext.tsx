import { createContext, useCallback, useMemo, useRef, useState } from 'react'
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

function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
    return stored as AppLanguage
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage)
  const cacheRef = useRef<TranslationCache>(new Map())

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

      const cache = cacheRef.current
      const results: string[] = new Array(texts.length)
      const uncached: { index: number; text: string }[] = []

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i]
        if (!text) {
          results[i] = text
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

      try {
        const textsToSend = uncached
          .map((u) => u.text)
          .filter((t) => t.trim())

        if (textsToSend.length === 0) {
          return results
        }

        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLanguage: language,
            texts: textsToSend,
          }),
        })

        if (!response.ok) {
          console.warn(
            `[translate] ${response.status} ${response.statusText}`,
            await response.text().catch(() => ''),
          )
          return results
        }

        const data = (await response.json()) as { translations: string[] }

        for (let i = 0; i < uncached.length; i++) {
          const { index, text } = uncached[i]
          const translated = data.translations?.[i] ?? text
          results[index] = translated
          cache.set(`${language}:${text}`, translated)
        }
      } catch {
        // Silent fallback: keep English text for uncached entries
      }

      return results
    },
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, translateTexts }),
    [language, setLanguage, t, translateTexts],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}
