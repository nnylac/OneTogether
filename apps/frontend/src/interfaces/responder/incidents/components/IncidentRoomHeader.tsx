import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import { BackToDashboardLink } from '../../components/BackToDashboardLink'
import type { Incident } from '../types'
import { IncidentStatusBadge } from './IncidentStatusBadge'

export function IncidentRoomHeader({ incident }: { incident: Incident }) {
  return (
    <Flex justify="space-between" align={{ base: 'stretch', xl: 'start' }} gap="4" direction={{ base: 'column', xl: 'row' }}>
      <VStack align="stretch" gap="3">
        <BackToDashboardLink />

        <Box>
          <HStack gap="3" wrap="wrap">
            <Heading size="2xl" color="gray.900">
              {incident.title}
            </Heading>
            <IncidentStatusBadge status={incident.status} />
          </HStack>
          <Text color="gray.500" fontWeight="700" mt="1">
            {incident.location}
          </Text>
          <Text color="gray.600" mt="2">
            {incident.description}
          </Text>
        </Box>
      </VStack>

      <VStack align={{ base: 'stretch', xl: 'end' }} gap="1">
        <Text color="gray.500" fontSize="sm" fontWeight="700">
          Room opened
        </Text>
        <Text color="gray.900" fontWeight="700">
          {incident.date}
        </Text>
      </VStack>
    </Flex>
  )
}
