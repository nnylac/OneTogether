import { useEffect, useState } from 'react'
import { Box, Flex, Heading, HStack, Stack, Text } from '../../../../components/chakra-ui'
import { fetchResourceSummary } from '../../resources/api/resourcesApi'
import type { ResourceSummary as ApiResourceSummary } from '../../resources/api/resourcesApi'
import { AssignedIncidentTickets } from '../components/AssignedIncidentTickets'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardNotifications } from '../components/DashboardNotifications'
import { ResourceSnapshot } from '../components/ResourceSnapshot'
import {
  dashboardMetrics,
  dashboardNotifications,
} from '../data/sampleDashboard'
import type { ResourceSnapshot as DashboardResourceSnapshot } from '../types'
import { incidents } from '../../incidents/data/sampleIncidents'

const activeIncidents = incidents.filter((incident) => incident.status !== 'closed')
const assignedIncidents = activeIncidents.slice(0, 3)

export function DashboardPage() {
  const [liveResourceSnapshot, setLiveResourceSnapshot] =
    useState<DashboardResourceSnapshot | null>(null)
  const [resourceError, setResourceError] = useState<string | undefined>()
  const [isResourceLoading, setIsResourceLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadResourceSnapshot() {
      try {
        setResourceError(undefined)
        setIsResourceLoading(true)
        const summary = await fetchResourceSummary()

        if (isMounted) {
          setLiveResourceSnapshot(
            summary.totals.total > 0
              ? mapResourceSummaryToSnapshot(summary)
              : null,
          )
          setResourceError(
            summary.totals.total > 0
              ? undefined
              : 'No resource data was pulled from the database.',
          )
        }
      } catch {
        if (isMounted) {
          setLiveResourceSnapshot(null)
          setResourceError('Unable to load resource data from the backend.')
        }
      } finally {
        if (isMounted) {
          setIsResourceLoading(false)
        }
      }
    }

    void loadResourceSnapshot()

    return () => {
      isMounted = false
    }
  }, [])

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

      <ResourceSnapshot
        errorMessage={resourceError}
        isLoading={isResourceLoading}
        snapshot={liveResourceSnapshot}
      />
    </Stack>
  )
}

function mapResourceSummaryToSnapshot(
  summary: ApiResourceSummary,
): DashboardResourceSnapshot {
  const availabilityRatio =
    summary.totals.total > 0 ? summary.totals.available / summary.totals.total : 0

  return {
    progress: [
      {
        label: 'Resources available',
        value: summary.totals.available,
        total: summary.totals.total,
        tone: availabilityRatio >= 0.4 ? 'green' : 'orange',
      },
      {
        label: 'Resources deployed',
        value: summary.totals.deployed,
        total: summary.totals.total,
        tone: 'orange',
      },
    ],
    counts: [
      {
        label: 'Reserved',
        value: summary.totals.reserved,
      },
      {
        label: 'Maintenance',
        value: summary.totals.maintenance,
      },
      {
        label: 'Critical outlets',
        value: summary.criticalOutlets.length,
      },
    ],
  }
}
