import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import type { Incident } from '../types'
import { IncidentStatusBadge } from './IncidentStatusBadge'

export function IncidentRoomHeader({ incident }: { incident: Incident }) {
  return (
    <Flex justify="space-between" align={{ base: 'stretch', xl: 'start' }} gap="4" direction={{ base: 'column', xl: 'row' }}>
      <VStack align="stretch" gap="3">
        <Button
          asChild
          variant="ghost"
          alignSelf="flex-start"
          color="gray.600"
          px="0"
          _hover={{ bg: 'transparent', color: 'gray.900' }}
        >
          <Link to="/responder/incidents">
            <Icon as={ArrowLeft} />
            Back to incidents
          </Link>
        </Button>

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
        <Text color="gray.900" fontWeight="800">
          {incident.date}
        </Text>
      </VStack>
    </Flex>
  )
}
