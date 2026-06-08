import { Box, Card, Flex, Heading, HStack, Stack, Text } from '../../../../components/chakra-ui'
import { ChevronRightLink } from '../../../../components/ui/ChevronRightLink'
import type { ResourceSnapshot as ResourceSnapshotData } from '../types'

type ResourceSnapshotProps = {
  errorMessage?: string
  isLoading?: boolean
  snapshot: ResourceSnapshotData | null
}

const progressColors = {
  green: 'green.500',
  orange: 'orange.400',
}

export function ResourceSnapshot({
  errorMessage,
  isLoading = false,
  snapshot,
}: ResourceSnapshotProps) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderWidth="1px" borderRadius="sm">
      <Card.Header>
        <Flex justify="space-between" align="start" gap="4">
          <Stack gap="1">
            <Heading size="lg" color="gray.900">
              Resource Snapshot
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Operational capacity available to support assigned incidents.
            </Text>
          </Stack>

          <HStack gap="2">
            <Box
              bg={snapshot ? 'green.50' : 'red.50'}
              borderColor={snapshot ? 'green.200' : 'red.200'}
              borderWidth="1px"
              color={snapshot ? 'green.700' : 'red.700'}
              fontSize="xs"
              fontWeight="800"
              px="3"
              py="1"
            >
              {snapshot ? 'LIVE' : 'NO DATA'}
            </Box>
            <ChevronRightLink to="/responder/resources" label="View all resources" />
          </HStack>
        </Flex>
      </Card.Header>

      <Card.Body>
        {!snapshot && (
          <Box bg="red.50" borderColor="red.200" borderWidth="1px" color="red.700" p="4">
            <Text fontWeight="800">
              {isLoading
                ? 'Loading resource data from the backend.'
                : errorMessage ?? 'No resource data was pulled from the database.'}
            </Text>
            <Text color="red.600" fontSize="sm" mt="1">
              Run a resource sync and confirm the external agency resource feeds are reachable.
            </Text>
          </Box>
        )}

        {snapshot && (
        <Flex gap="6" direction={{ base: 'column', xl: 'row' }}>
          <Stack gap="4" flex="1">
            {snapshot.progress.map((progress) => {
              const percent =
                progress.total > 0
                  ? Math.round((progress.value / progress.total) * 100)
                  : 0

              return (
                <Stack key={progress.label} gap="2">
                  <Flex justify="space-between" gap="4">
                    <Text color="gray.700" fontSize="sm">
                      {progress.label}
                    </Text>
                    <Text color="gray.900" fontSize="sm" fontWeight="700">
                      {progress.value.toLocaleString()}/{progress.total.toLocaleString()}
                    </Text>
                  </Flex>

                  <Box bg="gray.100" h="2" overflow="hidden">
                    <Box bg={progressColors[progress.tone]} h="100%" width={`${percent}%`} />
                  </Box>
                </Stack>
              )
            })}
          </Stack>

          <HStack gap="3" align="stretch" wrap="wrap">
            {snapshot.counts.map((count) => (
              <Stack key={count.label} bg="gray.50" gap="1" justify="center" minW="36" px="5" py="4" textAlign="center">
                <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">
                  {count.label}
                </Text>
                <Text color="gray.900" fontWeight="800">
                  {count.value.toLocaleString()}
                </Text>
              </Stack>
            ))}
          </HStack>
        </Flex>
        )}
      </Card.Body>
    </Card.Root>
  )
}
