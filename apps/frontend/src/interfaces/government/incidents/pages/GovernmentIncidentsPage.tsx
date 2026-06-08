import { useMemo, useState } from 'react'
import { Box, Heading, Stack, Text } from '../../../../components/chakra-ui'
import { GovernmentIncidentCard } from '../components/GovernmentIncidentCard'
import { IncidentFilterBar } from '../components/IncidentFilterBar'
import { sampleGovernmentIncidents } from '../data/sampleGovernmentIncidents'
import type { GovernmentIncident, GovernmentIncidentFilter } from '../types/incident'

const incidentFilters: GovernmentIncidentFilter[] = [
  'All',
  'Critical',
  'High',
  'Medium',
  'Low',
  'Open',
  'Triage',
  'Dispatched',
  'In Progress',
  'Resolved',
  'Public',
  'Private',
]

function doesIncidentMatchFilter(
  incident: GovernmentIncident,
  selectedFilter: GovernmentIncidentFilter,
) {
  if (selectedFilter === 'All') {
    return true
  }

  return (
    incident.severity === selectedFilter ||
    incident.status === selectedFilter ||
    incident.visibility === selectedFilter
  )
}

function countIncidentsForFilter(
  incidents: GovernmentIncident[],
  filter: GovernmentIncidentFilter,
) {
  return incidents.filter((incident) => doesIncidentMatchFilter(incident, filter)).length
}

export function GovernmentIncidentsPage() {
  const [selectedFilter, setSelectedFilter] =
    useState<GovernmentIncidentFilter>('All')

  const filterOptions = useMemo(() => {
    return incidentFilters.map((filter) => ({
      label: filter,
      count: countIncidentsForFilter(sampleGovernmentIncidents, filter),
    }))
  }, [])

  const filteredIncidents = useMemo(() => {
    return sampleGovernmentIncidents.filter((incident) =>
      doesIncidentMatchFilter(incident, selectedFilter),
    )
  }, [selectedFilter])

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

      {filteredIncidents.length === 0 ? (
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