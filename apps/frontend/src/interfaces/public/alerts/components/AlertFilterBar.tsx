import { Button, HStack } from '../../../../components/chakra-ui'
import type { PublicAlertSeverity } from '../types/alert'

export type AlertFilter = 'all' | PublicAlertSeverity

type AlertFilterBarProps = {
  activeFilter: AlertFilter
  counts: Record<AlertFilter, number>
  onChange: (filter: AlertFilter) => void
}

const filters: Array<{ label: string; value: AlertFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Advisory', value: 'advisory' },
  { label: 'Info', value: 'info' },
]

export function AlertFilterBar({
  activeFilter,
  counts,
  onChange,
}: AlertFilterBarProps) {
  return (
    <HStack gap="2" overflowX="auto" pb="1">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value

        return (
          <Button
            key={filter.value}
            bg={isActive ? 'gray.900' : 'white'}
            borderColor="gray.200"
            borderWidth="1px"
            color={isActive ? 'white' : 'gray.700'}
            flexShrink="0"
            onClick={() => onChange(filter.value)}
            px="4"
            _hover={{ bg: isActive ? 'gray.800' : 'gray.50' }}
          >
            {filter.label} ({counts[filter.value]})
          </Button>
        )
      })}
    </HStack>
  )
}
