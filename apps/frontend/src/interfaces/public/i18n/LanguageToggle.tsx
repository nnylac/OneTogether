import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Box, Button, Icon, Portal, VStack } from '../../../components/chakra-ui'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from './types'
import { useTranslation } from './useTranslation'

/**
 * Citizen-facing language picker for the public navbar.
 *
 * The open menu is rendered through a Portal so it escapes the navbar's
 * `overflowX="auto"` scroll container (which would otherwise clip the options).
 * It is positioned `fixed`, anchored to the trigger's bounding rect, and closes
 * on resize/scroll so it never drifts away from the button.
 *
 * The portaled menu is marked `data-no-translate` / `translate="no"` because it
 * lives outside the navbar subtree — without this the DOM translation engine
 * would rewrite the language names themselves.
 */
const MENU_WIDTH = 160

type MenuPosition = { top: number; left: number }

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const computePosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({
      top: rect.bottom + 8,
      left: rect.right - MENU_WIDTH,
    })
  }

  const openMenu = () => {
    computePosition()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const insideTrigger = wrapperRef.current?.contains(target)
      const insideMenu = menuRef.current?.contains(target)
      if (!insideTrigger && !insideMenu) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    // The menu is fixed-positioned against the trigger; rather than chase the
    // trigger on every frame, close when the layout shifts under it.
    const handleReflow = () => setOpen(false)

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleReflow)
    window.addEventListener('scroll', handleReflow, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleReflow)
      window.removeEventListener('scroll', handleReflow, true)
    }
  }, [open])

  return (
    <Box ref={wrapperRef} position="relative" data-no-translate>
      <Button
        variant="ghost"
        color="gray.600"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon as={Globe} />
        {LANGUAGE_LABELS[language]}
        <Icon
          as={ChevronDown}
          transition="transform 0.15s ease"
          transform={open ? 'rotate(180deg)' : 'rotate(0deg)'}
        />
      </Button>

      {open && (
        <Portal>
          <VStack
            ref={menuRef}
            data-no-translate
            translate="no"
            position="fixed"
            top={`${position.top}px`}
            left={`${position.left}px`}
            zIndex="1000"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="md"
            w={`${MENU_WIDTH}px`}
            gap="0"
            align="stretch"
            py="1"
            role="listbox"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant="ghost"
                justifyContent="space-between"
                borderRadius="0"
                color={lang === language ? 'blue.700' : 'gray.700'}
                fontWeight={lang === language ? '700' : '500'}
                role="option"
                aria-selected={lang === language}
                onClick={() => {
                  setLanguage(lang)
                  setOpen(false)
                }}
              >
                {LANGUAGE_LABELS[lang]}
                {lang === language && <Icon as={Check} />}
              </Button>
            ))}
          </VStack>
        </Portal>
      )}
    </Box>
  )
}
