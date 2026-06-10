import { useMemo, useState } from 'react'
import { Flex } from '../../../../components/chakra-ui'
import { defaultFilters } from '../../../shared/map/filterState'
import type { OverviewFilterState } from '../../../shared/map/filterState'
import { GovernmentMapCanvas } from '../components/GovernmentMapCanvas'
import { GovernmentMapError } from '../components/GovernmentMapError'
import { GovernmentMapHeader } from '../components/GovernmentMapHeader'
import { GovernmentMapSidebar } from '../components/GovernmentMapSidebar'
import { useGovernmentMapIncidents } from '../hooks/useGovernmentMapIncidents'
import {
  getGovernmentMapFilterOptions,
  getGovernmentMapIncidents,
  getGovernmentMapViewCounts,
} from '../utils/governmentMapFilters'

export function GovernmentMapPage() {
  const { error, incidents, isLoading } = useGovernmentMapIncidents()
  const [filters, setFilters] = useState<OverviewFilterState>(defaultFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filterOptions = useMemo(
    () => getGovernmentMapFilterOptions(incidents),
    [incidents],
  )
  const counts = useMemo(() => getGovernmentMapViewCounts(incidents), [incidents])
  const filteredIncidents = useMemo(
    () => getGovernmentMapIncidents(incidents, filters),
    [filters, incidents],
  )
  const effectiveSelectedId = useMemo(
    () =>
      selectedId && filteredIncidents.some((incident) => incident.id === selectedId)
        ? selectedId
        : null,
    [filteredIncidents, selectedId],
  )

  return (
    <Flex direction="column" gap="3" height="calc(100vh - 80px)">
      <GovernmentMapHeader />

      {error && <GovernmentMapError message={error} />}

      <Flex gap="3" flex="1" minH="0" direction={{ base: 'column', xl: 'row' }} align="stretch">
        <GovernmentMapCanvas
          incidents={filteredIncidents}
          isLoading={isLoading}
          onSelectIncident={setSelectedId}
          selectedId={effectiveSelectedId}
          totalIncidentCount={incidents.length}
        />

        <GovernmentMapSidebar
          agencies={filterOptions.agencies}
          counts={counts}
          filters={filters}
          incidents={filteredIncidents}
          onChangeFilters={setFilters}
          onSelectIncident={setSelectedId}
          selectedId={effectiveSelectedId}
          severities={filterOptions.severities}
          types={filterOptions.types}
        />
      </Flex>
    </Flex>
  )
}

