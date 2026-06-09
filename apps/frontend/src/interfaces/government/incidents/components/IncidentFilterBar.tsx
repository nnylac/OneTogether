import { HStack } from '../../../../components/chakra-ui'
import { IncidentFilterBadge } from './IncidentFilterBadge'
import type { GovernmentIncidentFilter } from '../types/incident'

type IncidentFilterOption = {
  label: string
  value: GovernmentIncidentFilter
  count: number
}

type IncidentFilterBarProps = {
  filters: IncidentFilterOption[]
  selectedFilter: GovernmentIncidentFilter
  onSelectFilter: (filter: GovernmentIncidentFilter) => void
}

export function IncidentFilterBar({
  filters,
  selectedFilter,
  onSelectFilter,
}: IncidentFilterBarProps) {
  return (
    <HStack gap="3" wrap="wrap">
      {filters.map((filter) => (
        <IncidentFilterBadge
          key={filter.value}
          label={filter.label}
          count={filter.count}
          isActive={selectedFilter === filter.value}
          onClick={() => onSelectFilter(filter.value)}
        />
      ))}
    </HStack>
  )
}
