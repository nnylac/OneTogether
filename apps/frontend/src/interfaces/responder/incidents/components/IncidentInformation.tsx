import type { ElementType, ReactNode } from 'react'
import {
  Activity,
  CalendarClock,
  Clock,
  FileDigit,
  HeartPulse,
  MapPin,
  Tag,
} from 'lucide-react'
import {
  Box,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { Incident, IncidentResource, IncidentSeverity } from '../types'
import { IncidentStatusBadge } from './IncidentStatusBadge'

const severityTones: Record<IncidentSeverity, LabelBoxTone> = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
}

export function IncidentInformation({
  incident,
  resources,
}: {
  incident: Incident
  resources: IncidentResource[]
}) {
  const confidenceScore = incident.confidenceScore ?? 0
  const assignedOrganisations = Array.from(
    new Set(
      resources.length > 0
        ? resources.map((resource) => resource.agency)
        : incident.assignedOrgs ?? [],
    ),
  )

  return (
    <Box flex="1" minH="0" overflowY="auto" p="6">
      <VStack align="stretch" gap="5">
        <Box>
          <Heading size="xl" color="gray.900">
            Incident information
          </Heading>
          <Text color="gray.500" mt="1">
            Consolidated details from the incident room.
          </Text>
        </Box>

        <Box bg="white" borderWidth="1px" borderColor="gray.200">
          <DetailRow icon={HeartPulse} label="Type">
            <Text color="gray.900" fontWeight="700">
              {incident.incidentType ?? 'Unassigned'}
            </Text>
          </DetailRow>

          <DetailRow icon={Activity} label="Severity / status">
            <HStack gap="2" wrap="wrap">
              {incident.severity && (
                <LabelBox tone={severityTones[incident.severity]} minW="28">
                  {incident.severity}
                </LabelBox>
              )}
              <IncidentStatusBadge status={incident.status} />
            </HStack>
          </DetailRow>

          <DetailRow icon={MapPin} label="Location">
            <Text color="gray.900" fontWeight="700">
              {incident.location}
            </Text>
          </DetailRow>

          <DetailRow icon={Activity} label="Confidence score">
            <HStack gap="3">
              <Box bg="gray.100" h="2" maxW="52" overflow="hidden" width="100%">
                <Box bg="green.500" h="100%" width={`${confidenceScore}%`} />
              </Box>
              <Text color="gray.700" fontWeight="700">
                {confidenceScore}%
              </Text>
            </HStack>
          </DetailRow>

          <DetailRow icon={Tag} label="Assigned organisations">
            <HStack gap="2" wrap="wrap">
              {(assignedOrganisations.length > 0 ? assignedOrganisations : ['None']).map((org) => (
                <LabelBox key={org} tone="gray">
                  {org}
                </LabelBox>
              ))}
            </HStack>
          </DetailRow>

          <DetailRow icon={CalendarClock} label="Reported">
            <Text color="gray.900" fontWeight="700">
              {incident.createdAt ?? incident.date}
            </Text>
          </DetailRow>

          <DetailRow icon={Clock} label="Last updated">
            <Text color="gray.900" fontWeight="700">
              {incident.updatedAt ?? incident.date}
            </Text>
          </DetailRow>

          <DetailRow icon={FileDigit} label="Incident code" isLast>
            <Text color="gray.900" fontWeight="700">
              {incident.incidentCode ?? incident.id}
            </Text>
          </DetailRow>
        </Box>

        <Box>
          <Heading size="md" color="gray.900" mb="3">
            Description
          </Heading>
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
            <Text color="gray.700" lineHeight="1.7">
              {incident.description}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}

function DetailRow({
  children,
  icon,
  isLast = false,
  label,
}: {
  children: ReactNode
  icon: ElementType
  isLast?: boolean
  label: string
}) {
  return (
    <Box
      alignItems="center"
      borderBottomWidth={isLast ? '0' : '1px'}
      borderColor="gray.100"
      columnGap="4"
      display="grid"
      gridTemplateColumns={{ base: 'minmax(0, 1fr)', md: '260px minmax(0, 1fr)' }}
      px="5"
      py="4"
      rowGap="2"
    >
      <HStack gap="3">
        <Icon as={icon} color="gray.400" boxSize="5" />
        <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Box minW="0">
        {children}
      </Box>
    </Box>
  )
}
