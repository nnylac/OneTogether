import { HStack } from '../../../../components/chakra-ui'
import { BroadcastFilterBadge } from './BroadcastFilterBadge'
import type { BroadcastFilter } from '../types/broadcast'

type BroadcastFilterOption = {
  label: string
  value: BroadcastFilter
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
