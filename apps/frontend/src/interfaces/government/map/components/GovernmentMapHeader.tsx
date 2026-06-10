import { Box, Flex, Heading, Text } from '../../../../components/chakra-ui'
import { governmentMapPollingIntervalMs } from '../constants'

export function GovernmentMapHeader() {
  return (
    <Flex justify="space-between" align="end" gap="3" px="1" flexShrink="0">
      <Box>
        <Heading size="xl" color="gray.900">
          National Operations Map
        </Heading>
        <Text color="gray.500" fontSize="sm" mt="1">
          All incidents across assigned responder organisations
        </Text>
      </Box>
      <Text color="gray.400" fontSize="xs" flexShrink="0">
        Auto-refresh every {governmentMapPollingIntervalMs / 1000}s
      </Text>
    </Flex>
  )
}

