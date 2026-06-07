import { Link } from 'react-router-dom'
import { Box, Card, Flex, Heading, Stack, Text } from '../../../../components/chakra-ui'
import { ChevronRightLink } from '../../../../components/ui/ChevronRightLink'
import type { Incident, IncidentStatus } from '../../incidents/types'
import { DashboardStatusLabel } from './DashboardStatusLabel'
import type { DashboardStatusTone } from './DashboardStatusLabel'

type AssignedIncidentTicketsProps = {
  incidents: Incident[]
}

const statusMeta: Record<IncidentStatus, { label: string; tone: DashboardStatusTone }> = {
  active: {
    label: 'In progress',
    tone: 'orange',
  },
  closed: {
    label: 'Closed',
    tone: 'gray',
  },
  resolved: {
    label: 'Resolved',
    tone: 'blue',
  },
}

export function AssignedIncidentTickets({ incidents }: AssignedIncidentTicketsProps) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderWidth="1px" borderRadius="sm">
      <Card.Header>
        <Flex justify="space-between" align="center" gap="4">
          <Heading size="lg" color="gray.900">
            Assigned Incident Tickets
          </Heading>
          <ChevronRightLink to="/responder/incidents" label="View all incident tickets" />
        </Flex>
      </Card.Header>

      <Card.Body>
        <Stack gap="3">
          {incidents.map((incident) => {
            const meta = statusMeta[incident.status]

            return (
              <Box
                key={incident.id}
                asChild
                borderColor="gray.200"
                borderWidth="1px"
                color="inherit"
                display="block"
                px="4"
                py="3"
                textDecoration="none"
                _hover={{ bg: 'gray.50' }}
              >
                <Link to={`/responder/incidents/${incident.id}/room`}>
                  <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap="4">
                    <Stack gap="1">
                      <Text color="gray.900" fontWeight="700">
                        {incident.title}
                      </Text>
                      <Text color="gray.500" fontSize="sm">
                        {incident.location} · {incident.incidentType ?? 'Incident'} ·{' '}
                        {incident.severity ?? (incident.isCritical ? 'Critical' : 'Medium')}
                      </Text>
                    </Stack>

                    <DashboardStatusLabel tone={meta.tone}>{meta.label}</DashboardStatusLabel>
                  </Flex>
                </Link>
              </Box>
            )
          })}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
