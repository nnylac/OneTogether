import { useEffect, useMemo, useState } from 'react'
import { Box, Heading, Stack, Text } from '../../../../components/chakra-ui'
import { fetchGovernmentIncidents } from '../api/governmentIncidentsApi'
import { GovernmentIncidentCard } from '../components/GovernmentIncidentCard'
import { IncidentFilterBar } from '../components/IncidentFilterBar'
import type { GovernmentIncident, GovernmentIncidentFilter } from '../types/incident'

const incidentFilters: GovernmentIncidentFilter[] = [
  'All',
  'Critical',
  'High',
  'Medium',
  'Low',
  'reported',
  'triage',
  'responding',
  'on_scene',
  'stabilising',
  'monitoring',
  'resolved',
  'closed',
]

const filterLabels: Record<GovernmentIncidentFilter, string> = {
  All: 'All',
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  reported: 'Reported',
  triage: 'Triage',
  responding: 'Responding',
  on_scene: 'On scene',
  stabilising: 'Stabilising',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  closed: 'Closed',
}

function doesIncidentMatchFilter(
  incident: GovernmentIncident,
  selectedFilter: GovernmentIncidentFilter,
) {
  if (selectedFilter === 'All') {
    return true
  }

  return (
    incident.severity === selectedFilter ||
    incident.status === selectedFilter
  )
}

function countIncidentsForFilter(
  incidents: GovernmentIncident[],
  filter: GovernmentIncidentFilter,
) {
  return incidents.filter((incident) => doesIncidentMatchFilter(incident, filter)).length
}

export function GovernmentIncidentsPage() {
  const [incidents, setIncidents] = useState<GovernmentIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] =
    useState<GovernmentIncidentFilter>('All')

  useEffect(() => {
    let isCurrent = true

    async function loadIncidents() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const nextIncidents = await fetchGovernmentIncidents()

        if (isCurrent) {
          setIncidents(nextIncidents)
        }
      } catch {
        if (isCurrent) {
          setLoadError('Unable to load incidents.')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadIncidents()

    return () => {
      isCurrent = false
    }
  }, [])

  const filterOptions = useMemo(() => {
    return incidentFilters.map((filter) => ({
      label: filterLabels[filter],
      value: filter,
      count: countIncidentsForFilter(incidents, filter),
    }))
  }, [incidents])

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) =>
      doesIncidentMatchFilter(incident, selectedFilter),
    )
  }, [incidents, selectedFilter])

  return (
    <Stack gap="5">
      <Box>
        <Heading size="3xl" color="gray.900">
          National Incidents
        </Heading>

        <Text color="gray.500" mt="1">
          Filter by incident badges to scan national tickets quickly.
        </Text>
      </Box>

      <IncidentFilterBar
        filters={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {isLoading ? (
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          px="5"
          py="8"
        >
          <Text color="gray.500">Loading incidents...</Text>
        </Box>
      ) : loadError ? (
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="red.200"
          px="5"
          py="8"
        >
          <Text color="red.600">{loadError}</Text>
        </Box>
      ) : filteredIncidents.length === 0 ? (
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          px="5"
          py="8"
        >
          <Text color="gray.500">No incidents found for this filter.</Text>
        </Box>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }}
          gap="4"
        >
          {filteredIncidents.map((incident) => (
            <GovernmentIncidentCard key={incident.id} incident={incident} />
          ))}
        </Box>
      )}
    </Stack>
  )
}
