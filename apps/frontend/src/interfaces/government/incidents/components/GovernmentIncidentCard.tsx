import { Box, Flex, Heading, HStack, Text } from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import { IncidentDetailBox } from './IncidentDetailBox'
import type {
  GovernmentIncident,
  GovernmentIncidentStatus,
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
  reported: 'yellow',
  triage: 'orange',
  responding: 'blue',
  on_scene: 'purple',
  stabilising: 'red',
  monitoring: 'yellow',
  resolved: 'green',
  closed: 'teal',
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

export function GovernmentIncidentCard({
  incident,
}: GovernmentIncidentCardProps) {
  const assignedResourceSummary =
    incident.assignedResources.length > 0
      ? incident.assignedResources
          .map((resource) => `${resource.agency} ${resource.unit}`)
          .join(', ')
      : 'None assigned'

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
      </HStack>

      <Text color="gray.600" fontSize="sm" mt="4">
        {incident.description ?? 'No description provided.'}
      </Text>

      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
        gap="3"
        mt="5"
      >
        <IncidentDetailBox
          label="Location"
          value={incident.location ?? 'Location unavailable'}
        />

        <IncidentDetailBox label="Created" value={incident.createdAt} />

        <IncidentDetailBox
          label="Assigned"
          value={
            incident.assignedOrgs.length > 0
              ? incident.assignedOrgs.join(', ')
              : 'None assigned'
          }
        />

        <IncidentDetailBox
          label="Agency progress"
          value={
            incident.agencyProgress.length > 0
              ? incident.agencyProgress
                  .map(
                    (progress) =>
                      `${progress.agency}: ${progress.stage.replace(/_/g, ' ')}`,
                  )
                  .join(', ')
              : 'No agency updates'
          }
        />

        <IncidentDetailBox label="Resources" value={assignedResourceSummary} />

        <IncidentDetailBox
          label="Volunteers"
          value={`${incident.volunteerCount} volunteers`}
        />
      </Box>
    </Box>
  )
}
