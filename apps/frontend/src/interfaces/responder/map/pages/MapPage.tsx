import { useEffect, useMemo, useState } from 'react'
import { Box, Flex, Heading, Text } from '../../../../components/chakra-ui'
import { useAuth } from '../../../auth/useAuth'
import { BackToDashboardLink } from '../../components/BackToDashboardLink'
import { fetchIncidents } from '../../incidents/api/incidentsApi'
import type { Incident, IncidentSeverity } from '../../incidents/types'
import { OverviewFilters } from '../../../shared/map/components/OverviewFilters'
import { OverviewIncidentList } from '../../../shared/map/components/OverviewIncidentList'
import { OverviewMap } from '../../../shared/map/components/OverviewMap'
import { ALL, defaultFilters } from '../../../shared/map/filterState'
import type { OverviewFilterState, OverviewView } from '../../../shared/map/filterState'

const overviewPollingIntervalMs = 10000

const SEVERITY_ORDER: IncidentSeverity[] = ['Critical', 'High', 'Medium', 'Low']

function distinct(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort()
}

/** True when an incident belongs to the given view tab (status gate only). */
function matchesView(incident: Incident, view: OverviewView): boolean {
  switch (view) {
    case 'history':
      return incident.status === 'closed'
    case 'critical':
      return incident.status !== 'closed' && incident.isCritical
    case 'active':
    default:
      return incident.status !== 'closed'
  }
}

/** True when an incident passes the chip filters (type / agency / severity). */
function matchesChips(incident: Incident, filters: OverviewFilterState): boolean {
  if (filters.type !== ALL && incident.incidentType !== filters.type) return false
  if (filters.severity !== ALL && incident.severity !== filters.severity) return false
  if (filters.agency !== ALL && !(incident.assignedOrgs ?? []).includes(filters.agency)) {
    return false
  }
  return true
}

export function MapPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filters, setFilters] = useState<OverviewFilterState>(defaultFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const organisationId = user?.userOrganisationId ?? user?.organisations[0]?.id ?? undefined

  useEffect(() => {
    let isMounted = true

    async function load(showLoading: boolean) {
      if (showLoading) setIsLoading(true)

      if (!organisationId) {
        if (isMounted) {
          setIncidents([])
          setError('No responder organisation is linked to this account.')
          setIsLoading(false)
        }
        return
      }

      try {
        const nextIncidents = await fetchIncidents({ organisationId })
        if (!isMounted) return
        setIncidents(nextIncidents)
        setError(null)
      } catch {
        if (isMounted) setError('Unable to load incidents from the backend.')
      } finally {
        if (showLoading && isMounted) setIsLoading(false)
      }
    }

    void load(true)
    const pollingId = window.setInterval(() => void load(false), overviewPollingIntervalMs)
    return () => {
      isMounted = false
      window.clearInterval(pollingId)
    }
  }, [organisationId])

  const types = useMemo(() => distinct(incidents.map((incident) => incident.incidentType)), [incidents])
  const agencies = useMemo(
    () => distinct(incidents.flatMap((incident) => incident.assignedOrgs ?? [])),
    [incidents],
  )
  const severities = useMemo(() => {
    const present = new Set(incidents.map((incident) => incident.severity))
    return SEVERITY_ORDER.filter((severity) => present.has(severity))
  }, [incidents])

  const viewCounts = useMemo(
    () => ({
      active: incidents.filter((incident) => matchesView(incident, 'active')).length,
      critical: incidents.filter((incident) => matchesView(incident, 'critical')).length,
      history: incidents.filter((incident) => matchesView(incident, 'history')).length,
    }),
    [incidents],
  )

  const filteredIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) => matchesView(incident, filters.view) && matchesChips(incident, filters),
      ),
    [incidents, filters],
  )

  // Derive the effective selection instead of mutating state in an effect: a
  // selection that filtering has hidden simply reads as "none" until reselected.
  const effectiveSelectedId = useMemo(
    () =>
      selectedId && filteredIncidents.some((incident) => incident.id === selectedId)
        ? selectedId
        : null,
    [filteredIncidents, selectedId],
  )

  return (
    <Flex direction="column" gap="3" height="calc(100vh - 80px)">
      {/* Compact header */}
      <Flex justify="space-between" align="end" gap="3" px="1" flexShrink="0">
        <Box>
          <BackToDashboardLink />
          <Heading size="xl" color="gray.900" mt="1">
            Operations Overview
          </Heading>
        </Box>
        <Text color="gray.400" fontSize="xs" flexShrink="0">
          Auto-refresh every {overviewPollingIntervalMs / 1000}s
        </Text>
      </Flex>

      {error && (
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" color="red.700" p="3" flexShrink="0">
          <Text fontWeight="700">{error}</Text>
        </Box>
      )}

      {/* Map + sidebar — fills remaining viewport */}
      <Flex gap="3" flex="1" minH="0" direction={{ base: 'column', xl: 'row' }} align="stretch">
        <Box
          flex={{ base: 'none', xl: '3' }}
          minW="0"
          borderWidth="1px"
          borderColor="gray.200"
          overflow="hidden"
          borderRadius="md"
        >
          {isLoading && incidents.length === 0 ? (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
              <Text color="gray.500">Loading operational map…</Text>
            </Box>
          ) : (
            <OverviewMap
              detailLink={(incident) => `/responder/incidents/${incident.id}/room`}
              detailLinkLabel="Open incident room"
              incidents={filteredIncidents}
              selectedId={effectiveSelectedId}
              onSelect={setSelectedId}
            />
          )}
        </Box>

        <Flex
          direction="column"
          gap="3"
          flex={{ base: 'none', xl: '1' }}
          minW="0"
          maxW={{ base: 'none', xl: '380px' }}
        >
          <OverviewFilters
            filters={filters}
            types={types}
            agencies={agencies}
            severities={severities}
            onChange={setFilters}
            resultCount={filteredIncidents.length}
          />
          <OverviewIncidentList
            incidents={filteredIncidents}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedId}
            view={filters.view}
            counts={viewCounts}
            detailLink={(incident) => `/responder/incidents/${incident.id}/room`}
            detailLinkLabel="Open incident room"
            onViewChange={(view) => setFilters((current) => ({ ...current, view }))}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
