import { useState } from 'react'
import {
  Box,
  Button,
  HStack,
  Text,
} from '../../../../components/chakra-ui'
import type {
  BroadcastTranslationLanguage,
  BroadcastTranslations,
} from '../api/aiBroadcastApi'

const languageTabs: Array<{
  id: BroadcastTranslationLanguage
  label: string
}> = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
  { id: 'ms', label: 'Bahasa Melayu' },
  { id: 'ta', label: 'தமிழ்' },
]

type BroadcastTranslationPanelProps = {
  translations: BroadcastTranslations
}

export function BroadcastTranslationPanel({
  translations,
}: BroadcastTranslationPanelProps) {
  const [activeLanguage, setActiveLanguage] =
    useState<BroadcastTranslationLanguage>('en')
  const entry = translations[activeLanguage]

  return (
    <Box bg="blue.50" borderColor="blue.200" borderWidth="1px" p="4">
      <Text color="gray.900" fontSize="sm" fontWeight="800" mb="2">
        Translations (read-only — the English draft is published)
      </Text>

      <HStack gap="2" mb="3" flexWrap="wrap">
        {languageTabs.map((tab) => (
          <Button
            key={tab.id}
            size="xs"
            variant={activeLanguage === tab.id ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => setActiveLanguage(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </HStack>

      {entry ? (
        <Box>
          <Text color="gray.900" fontSize="sm" fontWeight="700">
            {entry.title}
          </Text>
          <Text color="gray.700" fontSize="sm" mt="1" whiteSpace="pre-wrap">
            {entry.message}
          </Text>
        </Box>
      ) : (
        <Text color="gray.500" fontSize="sm">
          Translation unavailable for this language.
        </Text>
      )}
    </Box>
  )
}
