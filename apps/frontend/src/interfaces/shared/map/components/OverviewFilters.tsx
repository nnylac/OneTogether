import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import type { IncidentSeverity } from '../../../responder/incidents/types'
import { severityColor, typeLabel } from '../mapShared'
import { ALL, clearChipFilters, hasActiveChipFilters } from '../filterState'
import type { OverviewFilterState } from '../filterState'

type OverviewFiltersProps = {
  agencyLabel?: string
  agencies: string[]
  filters: OverviewFilterState
  onChange: (next: OverviewFilterState) => void
  resultCount: number
  severities: string[]
  types: string[]
}

export function OverviewFilters({
  agencyLabel = 'Agency',
  agencies,
  filters,
  onChange,
  resultCount,
  severities,
  types,
}: OverviewFiltersProps) {
  const isFiltered = hasActiveChipFilters(filters)

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
              onClick={() => onChange(clearChipFilters(filters))}
            >
              <Icon as={RotateCcw} boxSize="3.5" />
              Reset
            </Button>
          )}
        </HStack>
      </Flex>

      <VStack gap="3" align="stretch">
        <ChipRow
          label="Severity"
          value={filters.severity}
          options={severities}
          dotColor={(option) => severityColor(option as IncidentSeverity)}
          onChange={(value) => onChange({ ...filters, severity: value })}
        />
        <ChipRow
          label="Type"
          value={filters.type}
          options={types}
          formatOption={(option) => typeLabel(option)}
          onChange={(value) => onChange({ ...filters, type: value })}
        />
        <ChipRow
          label={agencyLabel}
          value={filters.agency}
          options={agencies}
          onChange={(value) => onChange({ ...filters, agency: value })}
        />
      </VStack>
    </Box>
  )
}

type ChipRowProps = {
  dotColor?: (value: string) => string
  formatOption?: (value: string) => string
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}

function ChipRow({
  dotColor,
  formatOption,
  label,
  onChange,
  options,
  value,
}: ChipRowProps) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="700"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb="1.5"
      >
        {label}
      </Text>
      <Flex gap="1.5" wrap="wrap">
        <Chip selected={value === ALL} onClick={() => onChange(ALL)}>
          All
        </Chip>
        {options.map((option) => (
          <Chip
            key={option}
            selected={value === option}
            dotColor={dotColor?.(option)}
            onClick={() => onChange(value === option ? ALL : option)}
          >
            {formatOption ? formatOption(option) : option}
          </Chip>
        ))}
      </Flex>
    </Box>
  )
}

function Chip({
  children,
  dotColor,
  onClick,
  selected,
}: {
  children: ReactNode
  dotColor?: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="inline-flex"
      alignItems="center"
      gap="1.5"
      px="2.5"
      py="1"
      borderRadius="full"
      borderWidth="1px"
      cursor="pointer"
      fontSize="xs"
      fontWeight="600"
      transition="all 0.1s ease"
      bg={selected ? 'gray.900' : 'white'}
      color={selected ? 'white' : 'gray.700'}
      borderColor={selected ? 'gray.900' : 'gray.200'}
      _hover={{ borderColor: selected ? 'gray.900' : 'gray.400' }}
    >
      {dotColor && (
        <Box width="8px" height="8px" borderRadius="full" bg={dotColor} flexShrink="0" />
      )}
      {children}
    </Box>
  )
}

