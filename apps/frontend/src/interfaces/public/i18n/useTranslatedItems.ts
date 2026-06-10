import { useEffect, useState } from 'react'
import { useTranslation } from './useTranslation'

/**
 * Reusable hook for translating arrays of items with dynamic text fields.
 *
 * - When language is English, returns `items` unchanged immediately.
 * - Otherwise, extracts translatable texts via `extractTexts`, calls the
 *   AI translation API in a single batch, then rebuilds each item with
 *   translated text via `applyTranslations`.
 * - Returns original items while translation is in-flight (progressive).
 * - Falls back to English silently on error.
 */
export function useTranslatedItems<T>(
  items: T[],
  extractTexts: (item: T) => string[],
  applyTranslations: (item: T, translations: string[]) => T,
): T[] {
  const { language, translateTexts } = useTranslation()
  const [translatedItems, setTranslatedItems] = useState<T[] | null>(null)

  useEffect(() => {
    if (language === 'en' || items.length === 0) {
      setTranslatedItems(null)
      return
    }

    const allTexts = items.flatMap(extractTexts)
    let cancelled = false

    void translateTexts(allTexts).then((results) => {
      if (cancelled) return
      let offset = 0
      const translated = items.map((item) => {
        const count = extractTexts(item).length
        const itemTranslations = results.slice(offset, offset + count)
        offset += count
        return applyTranslations(item, itemTranslations)
      })
      setTranslatedItems(translated)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, items, translateTexts])

  return translatedItems ?? items
}
