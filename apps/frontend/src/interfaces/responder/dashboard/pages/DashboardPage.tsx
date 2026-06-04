import { Box, Flex, Heading, HStack, Stack, Text } from '../../../../components/chakra-ui'
import { AssignedIncidentTickets } from '../components/AssignedIncidentTickets'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardNotifications } from '../components/DashboardNotifications'
import { ResourceSnapshot } from '../components/ResourceSnapshot'
import {
  dashboardMetrics,
  dashboardNotifications,
  resourceSnapshot,
} from '../data/sampleDashboard'
import { incidents } from '../../incidents/data/sampleIncidents'

const activeIncidents = incidents.filter((incident) => incident.status !== 'closed')
const assignedIncidents = activeIncidents.slice(0, 3)

export function DashboardPage() {
  return (
    <Stack gap="6" maxW="1600px">
      <Flex justify="space-between" align={{ base: 'stretch', lg: 'end' }} gap="4" direction={{ base: 'column', lg: 'row' }}>
        <Stack gap="1">
          <Heading size="3xl" color="gray.900">
            SCDF Operations Dashboard
          </Heading>
          <Text color="gray.600">Shared incident tickets from source systems and partner organisations.</Text>
        </Stack>
      </Flex>

      <HStack gap="4" align="stretch" wrap="wrap">
        {dashboardMetrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </HStack>

      <Box display="grid" gap="6" gridTemplateColumns={{ base: '1fr', xl: '3fr 2fr' }}>
        <AssignedIncidentTickets incidents={assignedIncidents} />
        <DashboardNotifications notifications={dashboardNotifications} />
      </Box>

      <ResourceSnapshot snapshot={resourceSnapshot} />
    </Stack>
  )
}
