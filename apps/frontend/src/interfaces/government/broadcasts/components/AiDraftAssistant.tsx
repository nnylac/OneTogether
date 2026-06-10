import { RefreshCw } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
} from '../../../../components/chakra-ui'

type AiDraftAssistantProps = {
  isGenerating?: boolean
  notice?: string | null
  onRegenerate: () => void
}

export function AiDraftAssistant({
  isGenerating = false,
  notice,
  onRegenerate,
}: AiDraftAssistantProps) {
  return (
    <Box bg="green.50" borderColor="green.200" borderWidth="1px" p="4">
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap="3"
        justify="space-between"
      >
        <Box>
          <Text color="gray.900" fontSize="sm" fontWeight="800">
            AI Draft Assistant
          </Text>

          <Text color="green.700" fontSize="sm" mt="1">
            Generate a suggested broadcast title and message based on the
            selected audience, zone, severity, and the live incident picture.
          </Text>

          {notice && (
            <Text color="orange.600" fontSize="sm" mt="1" fontWeight="600">
              {notice}
            </Text>
          )}
        </Box>

        <Button
          alignSelf={{ base: 'flex-start', md: 'center' }}
          bg="green.600"
          color="white"
          loading={isGenerating}
          size="sm"
          onClick={onRegenerate}
          _hover={{
            bg: 'green.700',
          }}
        >
          <Icon as={RefreshCw} />
          Regenerate
        </Button>
      </Flex>
    </Box>
  )
}
