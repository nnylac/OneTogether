import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Activity, MapPin, Package } from 'lucide-react'
import { Box, Flex, HStack, Icon, Text, VStack } from '../../../../components/chakra-ui'
import type { Incident, IncidentSeverity } from '../../incidents/types'
import type { ResourceSummary } from '../../resources/api/resourcesApi'
import { isActiveStatus, severityColor } from '../mapShared'

type OverviewStatRailProps = {
  incidents: Incident[]
  resourceSummary: ResourceSummary | null
}

const SEVERITY_ORDER: IncidentSeverity[] = ['Critical', 'High', 'Medium', 'Low']

export function OverviewStatRail({ incidents, resourceSummary }: OverviewStatRailProps) {
  const stats = useMemo(() => {
    const total = incidents.length
    const active = incidents.filter((incident) => isActiveStatus(incident.status)).length
    const critical = incidents.filter((incident) => incident.isCritical).length
    const unplotted = incidents.filter(
      (incident) => typeof incident.lat !== 'number' || typeof incident.lng !== 'number',
    ).length

    const bySeverity = SEVERITY_ORDER.map((severity) => ({
      severity,
      count: incidents.filter((incident) => incident.severity === severity).length,
    }))

    return { total, active, critical, unplotted, bySeverity }
  }, [incidents])

  const resourceTile = resourceSummary?.totals

  return (
    <StatGrid>
      <StatCard
        icon={Activity}
        accent="#2563eb"
        label="Active incidents"
        value={stats.active}
        detail={`${stats.total} total tracked`}
      />
      <StatCard
        icon={AlertTriangle}
        accent="#ef4444"
        label="Critical / high"
        value={stats.critical}
        detail="needing priority response"
      />
      <SeverityCard bySeverity={stats.bySeverity} />
      <StatCard
        icon={MapPin}
        accent="#7c3aed"
        label="Plotted on map"
        value={stats.total - stats.unplotted}
        detail={stats.unplotted > 0 ? `${stats.unplotted} without coordinates` : 'all geolocated'}
      />
      <ResourceCard totals={resourceTile} lastSyncedAt={resourceSummary?.lastSyncedAt ?? null} />
    </StatGrid>
  )
}

function StatGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      gap="3"
      gridTemplateColumns={{
        base: '1fr',
        sm: 'repeat(2, 1fr)',
        xl: 'repeat(5, 1fr)',
      }}
    >
      {children}
    </Box>
  )
}

type StatCardProps = {
  icon: typeof Activity
  accent: string
  label: string
  value: number
  detail: string
}

function StatCard({ icon, accent, label, value, detail }: StatCardProps) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <HStack gap="2" align="center">
        <Box
          bg={`${accent}1a`}
          color={accent}
          borderRadius="md"
          width="9"
          height="9"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize="5" />
        </Box>
        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
          {label}
        </Text>
      </HStack>
      <Text fontSize="3xl" fontWeight="800" color="gray.900" mt="2" lineHeight="1">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500" mt="1">
        {detail}
      </Text>
    </Box>
  )
}

function SeverityCard({
  bySeverity,
}: {
  bySeverity: Array<{ severity: IncidentSeverity; count: number }>
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
        By severity
      </Text>
      <VStack gap="1.5" mt="2.5" align="stretch">
        {bySeverity.map((entry) => (
          <Flex key={entry.severity} align="center" justify="space-between">
            <HStack gap="2">
              <Box width="9px" height="9px" borderRadius="full" bg={severityColor(entry.severity)} />
              <Text fontSize="sm" color="gray.700">
                {entry.severity}
              </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {entry.count}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  )
}

function ResourceCard({
  totals,
  lastSyncedAt,
}: {
  totals: ResourceSummary['totals'] | undefined
  lastSyncedAt: string | null
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <HStack gap="2" align="center">
        <Box
          bg="#0d948814"
          color="#0d9488"
          borderRadius="md"
          width="9"
          height="9"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={Package} boxSize="5" />
        </Box>
        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em">
          Resources deployed
        </Text>
      </HStack>
      {totals ? (
        <>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" mt="2" lineHeight="1">
            {totals.deployed}
          </Text>
          <Text fontSize="xs" color="gray.500" mt="1">
            {totals.available} available of {totals.total} units
          </Text>
        </>
      ) : (
        <Text fontSize="sm" color="gray.400" mt="3">
          Resource feed unavailable
        </Text>
      )}
      {lastSyncedAt && (
        <Text fontSize="2xs" color="gray.400" mt="1">
          synced {new Date(lastSyncedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </Box>
  )
}
