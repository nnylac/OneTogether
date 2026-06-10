import type { ChangeEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import { Box, Button, Flex, HStack, Icon, Text, VStack } from '../../../../components/chakra-ui'
import { ALL, defaultFilters } from '../filterState'
import type { OverviewFilterState } from '../filterState'

type OverviewFiltersProps = {
  filters: OverviewFilterState
  types: string[]
  agencies: string[]
  statuses: string[]
  onChange: (next: OverviewFilterState) => void
  resultCount: number
}

export function OverviewFilters({
  filters,
  types,
  agencies,
  statuses,
  onChange,
  resultCount,
}: OverviewFiltersProps) {
  const isFiltered =
    filters.type !== ALL || filters.agency !== ALL || filters.status !== ALL

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <Flex justify="space-between" align="center" mb="3">
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          Filters
        </Text>
        <HStack gap="2">
          <Text fontSize="xs" color="gray.500">
            {resultCount} match{resultCount === 1 ? '' : 'es'}
          </Text>
          {isFiltered && (
            <Button
              size="xs"
              variant="ghost"
              color="gray.600"
              _hover={{ bg: 'gray.100' }}
              onClick={() => onChange(defaultFilters)}
            >
              <Icon as={RotateCcw} boxSize="3.5" />
              Reset
            </Button>
          )}
        </HStack>
      </Flex>

      <VStack gap="3" align="stretch">
        <FilterSelect
          label="Type"
          value={filters.type}
          options={types}
          onChange={(value) => onChange({ ...filters, type: value })}
        />
        <FilterSelect
          label="Agency"
          value={filters.agency}
          options={agencies}
          onChange={(value) => onChange({ ...filters, agency: value })}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={statuses}
          formatOption={(value) => value.replace(/_/g, ' ')}
          onChange={(value) => onChange({ ...filters, status: value })}
        />
      </VStack>
    </Box>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  formatOption?: (value: string) => string
}

function FilterSelect({ label, value, options, onChange, formatOption }: FilterSelectProps) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em" mb="1.5">
        {label}
      </Text>
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        style={{
          width: '100%',
          height: '2.5rem',
          padding: '0 0.75rem',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          color: '#1f2937',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          textTransform: label === 'Status' ? 'capitalize' : 'none',
        }}
      >
        <option value={ALL}>All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </Box>
  )
}
