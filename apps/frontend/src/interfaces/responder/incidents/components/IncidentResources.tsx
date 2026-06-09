import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
import { Box, Flex, HStack, Heading, Icon, Text, VStack } from '../../../../components/chakra-ui'
import { fetchIncidentMap } from '../api/incidentMapApi'
import type { IncidentMapDto, IncidentMapResourceDto } from '../api/incidentMapDto'
import {
  formatClock,
  formatDistance,
  movementState,
  movementStateColor,
  movementStateLabel,
  progressOf,
  remainingMeters,
} from '../api/incidentMapUtils'

const REFRESH_MS = 2500
const CLOCK_TICK_MS = 1000

type IncidentResourcesProps = {
  incidentId: string
}

/**
 * Read-only operational view of the resources committed to an incident. Shares the
 * Map tab's live snapshot (`/api/maps/incidents/:id`) so the two stay consistent.
 * Pure situational awareness — no assignment or editing controls.
 */
export function IncidentResources({ incidentId }: IncidentResourcesProps) {
  const [snapshot, setSnapshot] = useState<IncidentMapDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Poll the snapshot; first load shows the loading state, refreshes are silent.
  useEffect(() => {
    let isMounted = true

    async function load(showLoading: boolean) {
      if (showLoading) {
        setIsLoading(true)
        setSnapshot(null)
      }
      try {
        const data = await fetchIncidentMap(incidentId)
        if (!isMounted) return
        setSnapshot(data)
        setError(null)
      } catch {
        if (isMounted) setError('Unable to load resource status.')
      } finally {
        if (showLoading && isMounted) setIsLoading(false)
      }
    }

    void load(true)
    const refreshId = window.setInterval(() => void load(false), REFRESH_MS)
    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [incidentId])

  // Steady clock so ETA-derived progress / distance stay live between polls.
  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS)
    return () => window.clearInterval(tickId)
  }, [])

  const resources = useMemo(() => snapshot?.resources ?? [], [snapshot])
  const incidentCode = snapshot?.incident.code ?? incidentId

  const counts = useMemo(() => {
    let dispatched = 0
    let enRoute = 0
    let arrived = 0
    for (const resource of resources) {
      const state = movementState(resource.status, progressOf(resource, nowMs))
      if (state === 'arrived') arrived += 1
      else if (state === 'en_route') enRoute += 1
      else if (state === 'dispatched') dispatched += 1
    }
    return { total: resources.length, dispatched, enRoute, arrived }
  }, [resources, nowMs])

  if (isLoading) {
    return <Notice tone="muted" title="Loading resource status…" body="Fetching dispatched units for this incident." />
  }

  if (error) {
    return <Notice tone="error" title="Resource status unavailable" body={error} />
  }

  return (
    <Box flex="1" minH="0" overflowY="auto" p="6">
      <VStack align="stretch" gap="5">
        <Flex
          justify="space-between"
          align={{ base: 'stretch', lg: 'center' }}
          gap="4"
          direction={{ base: 'column', lg: 'row' }}
        >
          <Box>
            <Heading size="xl" color="gray.900">
              Resource status
            </Heading>
            <Text color="gray.500" mt="1">
              Live situational awareness · Incident {incidentCode}
            </Text>
          </Box>

          <HStack gap="2" flexWrap="wrap">
            <CountChip label="Total" value={counts.total} color="gray.700" />
            <CountChip label="Dispatched" value={counts.dispatched} color="#3b82f6" />
            <CountChip label="En route" value={counts.enRoute} color="#f59e0b" />
            <CountChip label="Arrived" value={counts.arrived} color="#22c55e" />
          </HStack>
        </Flex>

        {resources.length === 0 ? (
          <Box bg="white" borderWidth="1px" borderColor="gray.200" px="5" py="8" textAlign="center">
            <Text color="gray.500" fontWeight="600">
              No resources dispatched to this incident yet.
            </Text>
          </Box>
        ) : (
          <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
            <Box as="table" width="100%" borderCollapse="collapse" tableLayout="fixed" minW="860px">
              <Box as="colgroup">
                <Box as="col" width="22%" />
                <Box as="col" width="13%" />
                <Box as="col" width="12%" />
                <Box as="col" width="11%" />
                <Box as="col" width="13%" />
                <Box as="col" width="14%" />
                <Box as="col" width="15%" />
              </Box>

              <Box as="thead" bg="gray.50">
                <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
                  <HeaderCell>Organisation</HeaderCell>
                  <HeaderCell>State</HeaderCell>
                  <HeaderCell>Departed</HeaderCell>
                  <HeaderCell>ETA</HeaderCell>
                  <HeaderCell>Est. arrival</HeaderCell>
                  <HeaderCell>Dist. remaining</HeaderCell>
                  <HeaderCell>Notes</HeaderCell>
                </Box>
              </Box>

              <Box as="tbody">
                {resources.map((resource) => (
                  <ResourceRow key={resource.id} resource={resource} nowMs={nowMs} />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

function ResourceRow({ resource, nowMs }: { resource: IncidentMapResourceDto; nowMs: number }) {
  const progress = progressOf(resource, nowMs)
  const state = movementState(resource.status, progress)
  const arrived = state === 'arrived'
  const stateColor = movementStateColor(state)

  const eta =
    !arrived && resource.etaMinutes != null ? `${resource.etaMinutes} min` : '—'
  const estArrival = !arrived ? formatClock(resource.etaAt) || '—' : '—'
  const remaining = remainingMeters(resource, nowMs)
  const distance = !arrived && remaining != null ? formatDistance(remaining) : '—'

  return (
    <Box as="tr" borderBottomWidth="1px" borderColor="gray.100" _hover={{ bg: 'gray.50' }}>
      <BodyCell>
        <Text color="gray.900" fontWeight="700" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {resource.agency}
        </Text>
        {resource.originStation && (
          <Text color="gray.500" fontSize="xs" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {resource.originStation}
          </Text>
        )}
      </BodyCell>

      <BodyCell>
        <HStack gap="2" minW="0">
          <Box width="8px" height="8px" borderRadius="full" bg={stateColor} flexShrink="0" />
          <Text color="gray.700" fontWeight="600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {movementStateLabel(state)}
          </Text>
        </HStack>
      </BodyCell>

      <BodyCell>
        <Text color="gray.600">{formatClock(resource.dispatchedAt) || '—'}</Text>
      </BodyCell>

      <BodyCell>
        <Text color="gray.600">{eta}</Text>
      </BodyCell>

      <BodyCell>
        <Text color="gray.600">{estArrival}</Text>
      </BodyCell>

      <BodyCell>
        <Text color="gray.600">{distance}</Text>
      </BodyCell>

      <BodyCell>
        <Text
          color={resource.notes ? 'gray.700' : 'gray.400'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={resource.notes ?? undefined}
        >
          {resource.notes || '—'}
        </Text>
      </BodyCell>
    </Box>
  )
}

function CountChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" px="3" py="1.5" minW="84px">
      <Text fontSize="lg" fontWeight="700" color={color} lineHeight="1.1">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">
        {label}
      </Text>
    </Box>
  )
}

function HeaderCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box
      as="th"
      color="gray.500"
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0"
      px="4"
      py="3"
      textAlign={textAlign}
      textTransform="uppercase"
    >
      {children}
    </Box>
  )
}

function BodyCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box as="td" px="4" py="3" textAlign={textAlign} verticalAlign="middle">
      {children}
    </Box>
  )
}

function Notice({
  tone,
  title,
  body,
}: {
  tone: 'muted' | 'error'
  title: string
  body: string
}) {
  const palette = {
    muted: { bg: 'gray.50', border: 'gray.200', color: 'gray.700', icon: Activity },
    error: { bg: 'red.50', border: 'red.200', color: 'red.700', icon: AlertTriangle },
  }[tone]

  return (
    <Box flex="1" minH="0" p="6">
      <Box
        bg={palette.bg}
        borderWidth="1px"
        borderColor={palette.border}
        color={palette.color}
        px="6"
        py="5"
      >
        <Icon as={palette.icon} boxSize="5" />
        <Heading size="sm" mt="2">
          {title}
        </Heading>
        <Text fontSize="sm" mt="1">
          {body}
        </Text>
      </Box>
    </Box>
  )
}
