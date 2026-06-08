import { HStack } from '../../../../components/chakra-ui'
import { BroadcastFilterBadge } from './BroadcastFilterBadge'
import type { BroadcastFilter } from '../types/broadcast'

type BroadcastFilterOption = {
  label: BroadcastFilter
  count: number
}

type BroadcastFilterBarProps = {
  filters: BroadcastFilterOption[]
  selectedFilter: BroadcastFilter
  onSelectFilter: (filter: BroadcastFilter) => void
}

export function BroadcastFilterBar({
  filters,
  selectedFilter,
  onSelectFilter,
}: BroadcastFilterBarProps) {
  return (
    <HStack gap="3" wrap="wrap">
      {filters.map((filter) => (
        <BroadcastFilterBadge
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