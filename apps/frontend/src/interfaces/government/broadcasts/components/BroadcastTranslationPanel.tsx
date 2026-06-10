import {
  Box,
  Text,
} from '../../../../components/chakra-ui'
import type {
  BroadcastTranslations,
} from '../api/aiBroadcastApi'

type BroadcastTranslationPanelProps = {
  translations: BroadcastTranslations
}

export function BroadcastTranslationPanel({
  translations,
}: BroadcastTranslationPanelProps) {
  const entry = translations['en']

  return (
    <Box bg="blue.50" borderColor="blue.200" borderWidth="1px" p="4">
      <Text color="gray.900" fontSize="sm" fontWeight="800" mb="2">
        Translation
      </Text>

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
