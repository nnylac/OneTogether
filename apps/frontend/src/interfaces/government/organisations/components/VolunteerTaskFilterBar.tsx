import { Box, Flex, Select, Text } from '../../../../components/chakra-ui'
import type {
  VolunteerTaskFilterState,
  VolunteerTaskSchedule,
  VolunteerTaskUrgency,
} from '../types/organisation'

type VolunteerTaskFilterBarProps = {
  filters: VolunteerTaskFilterState
  organisationOptions: string[]
  onChangeFilters: (filters: VolunteerTaskFilterState) => void
}

const scheduleOptions: Array<'All' | VolunteerTaskSchedule> = [
  'All',
  'Past',
  'Today',
  'Upcoming',
]

const urgencyOptions: Array<'All' | VolunteerTaskUrgency> = [
  'All',
  'Low',
  'Medium',
  'High',
  'Critical',
]

export function VolunteerTaskFilterBar({
  filters,
  organisationOptions,
  onChangeFilters,
}: VolunteerTaskFilterBarProps) {
  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="4">
      <Flex gap="3" wrap="wrap">
        <Box minW={{ base: 'full', md: '240px' }} flex="1">
          <FilterLabel>Organisation</FilterLabel>

          <Select
            value={filters.organisation}
            onChange={(event) =>
              onChangeFilters({
                ...filters,
                organisation: event.target.value,
              })
            }
          >
            <option value="All">All organisations</option>
            {organisationOptions.map((organisation) => (
              <option key={organisation} value={organisation}>
                {organisation}
              </option>
            ))}
          </Select>
        </Box>

        <Box minW={{ base: 'full', md: '180px' }} flex="1">
          <FilterLabel>Schedule</FilterLabel>

          <Select
            value={filters.schedule}
            onChange={(event) =>
              onChangeFilters({
                ...filters,
                schedule: event.target.value as 'All' | VolunteerTaskSchedule,
              })
            }
          >
            {scheduleOptions.map((schedule) => (
              <option key={schedule} value={schedule}>
                {schedule === 'All' ? 'All schedules' : schedule}
              </option>
            ))}
          </Select>
        </Box>

        <Box minW={{ base: 'full', md: '180px' }} flex="1">
          <FilterLabel>Urgency</FilterLabel>

          <Select
            value={filters.urgency}
            onChange={(event) =>
              onChangeFilters({
                ...filters,
                urgency: event.target.value as 'All' | VolunteerTaskUrgency,
              })
            }
          >
            {urgencyOptions.map((urgency) => (
              <option key={urgency} value={urgency}>
                {urgency === 'All' ? 'All urgency levels' : urgency}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>
    </Box>
  )
}

function FilterLabel({ children }: { children: string }) {
  return (
    <Text
      color="gray.500"
      fontSize="xs"
      fontWeight="800"
      mb="2"
      textTransform="uppercase"
    >
      {children}
    </Text>
  )
}