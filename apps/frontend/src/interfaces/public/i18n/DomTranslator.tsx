import { useEffect, useRef } from 'react'
import { useTranslation } from './useTranslation'

/**
 * Runtime DOM auto-translation engine for the citizen-facing interface.
 *
 * Walks visible text nodes under <body>, batches their English source strings
 * to the backend OpenAI translator, and swaps the translated text in place.
 * Because it operates on rendered output, it covers both hardcoded JSX and
 * dynamic sample content (alerts, communities, incidents) without per-component
 * changes. IDs, timestamps, numbers, routes (href attributes), and opted-out
 * subtrees are left untouched. Switching back to English restores the captured
 * originals losslessly.
 *
 * Mount once, inside a route subtree that should be translated.
 */

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
])

const LETTER = /\p{L}/u
// e.g. INC-2026-0519 — an identifier, not display prose.
const ID_PATTERN = /^[A-Z]{2,}-\d/
const URL_PATTERN = /^(https?:\/\/|www\.|\/)/i
const DEBOUNCE_MS = 200

type Written = { lang: string; value: string }

function hasTranslatableAncestors(node: Text): boolean {
  let el: Node | null = node.parentNode
  while (el && el instanceof Element) {
    if (SKIP_TAGS.has(el.tagName)) return false
    if (el.hasAttribute('data-no-translate')) return false
    if (el.getAttribute('translate') === 'no') return false
    el = el.parentNode
  }
  return true
}

function isTranslatableText(core: string): boolean {
  if (core.length === 0) return false
  if (!LETTER.test(core)) return false // pure numbers / dates / symbols
  if (ID_PATTERN.test(core)) return false
  if (URL_PATTERN.test(core)) return false
  return true
}

// Split a text node value into [leadingWhitespace, core, trailingWhitespace]
// so translating the core preserves surrounding layout whitespace.
function splitParts(raw: string): [string, string, string] {
  const leading = raw.match(/^\s*/)?.[0] ?? ''
  const trailing = raw.match(/\s*$/)?.[0] ?? ''
  const core = raw.slice(leading.length, raw.length - trailing.length)
  return [leading, core, trailing]
}

export function DomTranslator() {
  const { language, translateTexts } = useTranslation()

  // Node -> original English nodeValue (captured on first sighting).
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap())
  // Node -> last value we wrote, used to skip up-to-date nodes and to detect
  // when React has replaced the text with fresh English content.
  const writtenRef = useRef<WeakMap<Text, Written>>(new WeakMap())

  const processingRef = useRef(false)
  const dirtyRef = useRef(false)

  useEffect(() => {
    const originals = originalsRef.current
    const written = writtenRef.current
    let observer: MutationObserver | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const walkTextNodes = (visit: (node: Text) => void) => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      )
      let current = walker.nextNode()
      while (current) {
        visit(current as Text)
        current = walker.nextNode()
      }
    }

    const restoreEnglish = () => {
      observer?.disconnect()
      walkTextNodes((node) => {
        const original = originals.get(node)
        if (original !== undefined && node.nodeValue !== original) {
          node.nodeValue = original
        }
      })
      reconnect()
    }

    const runPass = async () => {
      if (cancelled) return
      if (processingRef.current) {
        dirtyRef.current = true
        return
      }
      processingRef.current = true
      try {
        if (language === 'en') {
          restoreEnglish()
          return
        }

        // Collect candidate nodes and the unique English cores to translate.
        const cores: string[] = []
        const coreIndex = new Map<string, number>()
        const entries: {
          node: Text
          leading: string
          trailing: string
          index: number
        }[] = []

        walkTextNodes((node) => {
          if (!hasTranslatableAncestors(node)) return

          const current = node.nodeValue ?? ''
          const prev = written.get(node)
          if (prev && prev.lang === language && current === prev.value) {
            return // already translated for this language
          }

          // Establish the English source. On first sighting, or whenever React
          // has rewritten the node with fresh content, the current value is the
          // English source of truth.
          if (!originals.has(node) || (prev && current !== prev.value)) {
            originals.set(node, current)
          }
          const englishRaw = originals.get(node) ?? current

          const [leading, core, trailing] = splitParts(englishRaw)
          if (!isTranslatableText(core)) return

          let idx = coreIndex.get(core)
          if (idx === undefined) {
            idx = cores.length
            cores.push(core)
            coreIndex.set(core, idx)
          }
          entries.push({ node, leading, trailing, index: idx })
        })

        if (cores.length === 0) return

        const translations = await translateTexts(cores)
        if (cancelled) return

        observer?.disconnect()
        for (const { node, leading, trailing, index } of entries) {
          if (!node.isConnected) continue
          const translated = translations[index]
          if (translated === undefined) continue
          const value = `${leading}${translated}${trailing}`
          if (node.nodeValue !== value) node.nodeValue = value
          written.set(node, { lang: language, value })
        }
        reconnect()
      } finally {
        processingRef.current = false
        if (dirtyRef.current && !cancelled) {
          dirtyRef.current = false
          schedule()
        }
      }
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void runPass()
      }, DEBOUNCE_MS)
    }

    function reconnect() {
      if (cancelled || !observer) return
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      })
    }

    observer = new MutationObserver(() => {
      schedule()
    })
    reconnect()

    // Schedule (not run) the first pass so the mount pass and any immediate
    // observer mutations coalesce into a single debounced pass instead of
    // double-running. Runs after paint, so a language switch never blocks the
    // click that triggered it.
    schedule()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      observer?.disconnect()
      observer = null
    }
  }, [language, translateTexts])

  return null
}
