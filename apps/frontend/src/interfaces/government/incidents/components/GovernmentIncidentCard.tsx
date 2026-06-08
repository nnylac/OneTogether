import { Box, Flex, Heading, HStack, Stack, Text } from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import { IncidentDetailBox } from './IncidentDetailBox'
import type {
  GovernmentIncident,
  GovernmentIncidentStatus,
  GovernmentIncidentVisibility,
} from '../types/incident'
import type { IncidentSeverity } from '../../../responder/incidents/types'

type GovernmentIncidentCardProps = {
  incident: GovernmentIncident
}

const severityTones: Record<IncidentSeverity, LabelBoxTone> = {
  Critical: 'red',
  High: 'orange',
  Medium: 'yellow',
  Low: 'green',
}

const statusTones: Record<GovernmentIncidentStatus, LabelBoxTone> = {
  Open: 'gray',
  Triage: 'purple',
  Dispatched: 'blue',
  'In Progress': 'orange',
  Resolved: 'teal',
}

const visibilityTones: Record<GovernmentIncidentVisibility, LabelBoxTone> = {
  Public: 'green',
  Private: 'gray',
}

function getIncidentTypeTone(incidentType: string): LabelBoxTone {
  const normalizedType = incidentType.toLowerCase()

  if (normalizedType.includes('medical')) {
    return 'blue'
  }

  if (normalizedType.includes('flood')) {
    return 'purple'
  }

  if (normalizedType.includes('infrastructure')) {
    return 'yellow'
  }

  return 'gray'
}

export function GovernmentIncidentCard({ incident }: GovernmentIncidentCardProps) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      p="4"
      minH="64"
    >
      <Flex justify="space-between" align="start" gap="4">
        <Box>
          <Text color="gray.500" fontSize="sm" fontWeight="700">
            {incident.id}
          </Text>

          <Heading size="md" color="gray.900" mt="1">
            {incident.title}
          </Heading>
        </Box>

        <LabelBox tone={statusTones[incident.status]} minW="24">
          {incident.status.toUpperCase()}
        </LabelBox>
      </Flex>

      <HStack gap="2" wrap="wrap" mt="4">
        <LabelBox tone={severityTones[incident.severity]}>
          {incident.severity.toUpperCase()}
        </LabelBox>

        <LabelBox tone={getIncidentTypeTone(incident.incidentType)}>
          {incident.incidentType.toUpperCase()}
        </LabelBox>

        <LabelBox tone={visibilityTones[incident.visibility]}>
          {incident.visibility.toUpperCase()}
        </LabelBox>
      </HStack>

      <Text color="gray.600" fontSize="sm" mt="4">
        {incident.description}
      </Text>

      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
        gap="3"
        mt="5"
      >
        <IncidentDetailBox label="Location" value={incident.location} />

        <IncidentDetailBox label="Created" value={incident.createdAt} />

        <IncidentDetailBox
          label="Assigned"
          value={incident.assignedOrgs.join(', ')}
        />

        <IncidentDetailBox
          label="Responding"
          value={`${incident.respondingUnits} units · ${incident.volunteerCount} volunteers`}
        />
      </Box>
    </Box>
  )
}