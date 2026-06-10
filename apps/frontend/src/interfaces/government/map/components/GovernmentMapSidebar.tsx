import { Flex } from '../../../../components/chakra-ui'
import { OverviewFilters } from '../../../shared/map/components/OverviewFilters'
import { OverviewIncidentList } from '../../../shared/map/components/OverviewIncidentList'
import type { Incident } from '../../../responder/incidents/types'
import type {
  OverviewFilterState,
  OverviewView,
} from '../../../shared/map/filterState'

type GovernmentMapSidebarProps = {
  agencies: string[]
  counts: Record<OverviewView, number>
  filters: OverviewFilterState
  incidents: Incident[]
  onChangeFilters: (filters: OverviewFilterState) => void
  onSelectIncident: (id: string | null) => void
  selectedId: string | null
  severities: string[]
  types: string[]
}

export function GovernmentMapSidebar({
  agencies,
  counts,
  filters,
  incidents,
  onChangeFilters,
  onSelectIncident,
  selectedId,
  severities,
  types,
}: GovernmentMapSidebarProps) {
  return (
    <Flex
      direction="column"
      gap="3"
      flex={{ base: 'none', xl: '1' }}
      minW="0"
      maxW={{ base: 'none', xl: '380px' }}
    >
      <OverviewFilters
        agencyLabel="Organisation"
        filters={filters}
        types={types}
        agencies={agencies}
        severities={severities}
        onChange={onChangeFilters}
        resultCount={incidents.length}
      />
      <OverviewIncidentList
        accentColor="blue"
        incidents={incidents}
        selectedId={selectedId}
        onSelect={onSelectIncident}
        view={filters.view}
        counts={counts}
        onViewChange={(view) => onChangeFilters({ ...filters, view })}
      />
    </Flex>
  )
}

