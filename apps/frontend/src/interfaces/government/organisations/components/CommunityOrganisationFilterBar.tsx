import { HStack } from '../../../../components/chakra-ui'
import { CommunityOrganisationFilterBadge } from './CommunityOrganisationFilterBadge'
import type { CommunityOrganisationFilter } from '../types/organisation'

type CommunityOrganisationFilterOption = {
  label: CommunityOrganisationFilter
  count: number
}

type CommunityOrganisationFilterBarProps = {
  filters: CommunityOrganisationFilterOption[]
  selectedFilter: CommunityOrganisationFilter
  onSelectFilter: (filter: CommunityOrganisationFilter) => void
}

export function CommunityOrganisationFilterBar({
  filters,
  selectedFilter,
  onSelectFilter,
}: CommunityOrganisationFilterBarProps) {
  return (
    <HStack gap="3" wrap="wrap">
      {filters.map((filter) => (
        <CommunityOrganisationFilterBadge
          key={filter.label}
          label={filter.label}
          count={filter.count}
          isActive={selectedFilter === filter.label}
          onClick={() => onSelectFilter(filter.label)}
        />
      ))}
    </HStack>
  )
}