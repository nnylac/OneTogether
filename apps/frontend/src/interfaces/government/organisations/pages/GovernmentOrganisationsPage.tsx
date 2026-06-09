import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import {
  fetchResourceOutlets,
  fetchResourceSummary,
  syncResources,
} from '../../../responder/resources/api/resourcesApi'
import type {
  ResourceOutlet,
  ResourceSummary,
} from '../../../responder/resources/api/resourcesApi'
import { CommunityOrganisationFilterBar } from '../components/CommunityOrganisationFilterBar'
import { GovernmentOrganisationCard } from '../components/GovernmentOrganisationCard'
import { HospitalCard } from '../components/HospitalCard'
import { OrganisationSectionFilterBar } from '../components/OrganisationSectionFilterBar'
import { OrganisationSummaryCard } from '../components/OrganisationSummaryCard'
import { VolunteerTaskFilterBar } from '../components/VolunteerTaskFilterBar'
import { VolunteerTaskRow } from '../components/VolunteerTaskRow'
import { mockCommunityOrganisations } from '../data/mockCommunityOrganisations'
import { mockHospitals } from '../data/mockHospitals'
import { mockVolunteerTasks } from '../data/mockVolunteerTasks'
import type {
  CommunityOrganisation,
  CommunityOrganisationFilter,
  Hospital,
  OrganisationSection,
  VolunteerTask,
  VolunteerTaskFilterState,
} from '../types/organisation'
import { mapResourceOutletsToHospitals } from '../utils/resourceMapping'

const emptySummary: ResourceSummary = {
  lastSyncedAt: null,
  totals: {
    total: 0,
    available: 0,
    deployed: 0,
    reserved: 0,
    maintenance: 0,
  },
  byAgency: [],
  byCategory: [],
  criticalOutlets: [],
}

const communityOrganisationFilters: CommunityOrganisationFilter[] = [
  'All',
  'Government',
  'Healthcare',
  'NGO',
  'Grassroots',
]

function doesCommunityOrganisationMatchFilter(
  organisation: CommunityOrganisation,
  selectedFilter: CommunityOrganisationFilter,
) {
  if (selectedFilter === 'All') {
    return true
  }

  return organisation.type === selectedFilter
}

function countCommunityOrganisationsForFilter(
  organisations: CommunityOrganisation[],
  filter: CommunityOrganisationFilter,
) {
  return organisations.filter((organisation) =>
    doesCommunityOrganisationMatchFilter(organisation, filter),
  ).length
}

export function GovernmentOrganisationsPage() {
  const [selectedSection, setSelectedSection] =
    useState<OrganisationSection>('Community Organisations')

  const [selectedCommunityFilter, setSelectedCommunityFilter] =
    useState<CommunityOrganisationFilter>('All')

  const [volunteerTaskFilters, setVolunteerTaskFilters] =
    useState<VolunteerTaskFilterState>({
      organisation: 'All',
      schedule: 'All',
      urgency: 'All',
    })

  const [outlets, setOutlets] = useState<ResourceOutlet[]>([])
  const [summary, setSummary] = useState<ResourceSummary>(emptySummary)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hospitalRefreshTimes, setHospitalRefreshTimes] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    let isMounted = true

    async function loadResources() {
      try {
        const [nextSummary, nextOutlets] = await Promise.all([
          fetchResourceSummary(),
          fetchResourceOutlets(),
        ])

        if (isMounted) {
          setSummary(nextSummary)
          setOutlets(nextOutlets)
        }
      } catch {
        if (isMounted) {
          setError(
            'Unable to load hospital resources from the backend. Showing mock hospital data instead.',
          )
        }
      }
    }

    void loadResources()

    return () => {
      isMounted = false
    }
  }, [])

  const hospitals = useMemo(() => {
    const apiHospitals = mapResourceOutletsToHospitals(outlets)
    const sourceHospitals =
      apiHospitals.length > 0 ? apiHospitals : mockHospitals

    return sourceHospitals.map((hospital) => ({
      ...hospital,
      lastUpdatedAt: hospitalRefreshTimes[hospital.id] ?? hospital.lastUpdatedAt,
    }))
  }, [hospitalRefreshTimes, outlets])

  const communityFilterOptions = useMemo(() => {
    return communityOrganisationFilters.map((filter) => ({
      label: filter,
      count: countCommunityOrganisationsForFilter(
        mockCommunityOrganisations,
        filter,
      ),
    }))
  }, [])

  const filteredCommunityOrganisations = useMemo(() => {
    return mockCommunityOrganisations.filter((organisation) =>
      doesCommunityOrganisationMatchFilter(
        organisation,
        selectedCommunityFilter,
      ),
    )
  }, [selectedCommunityFilter])

  const volunteerOrganisationOptions = useMemo(() => {
    return uniqueStrings(mockVolunteerTasks.map((task) => task.organisation))
  }, [])

  const filteredVolunteerTasks = useMemo(() => {
    return mockVolunteerTasks.filter((task) =>
      doesVolunteerTaskMatchFilters(task, volunteerTaskFilters),
    )
  }, [volunteerTaskFilters])

  const summaryCards = useMemo(() => {
    const activeCommunityOrgs = mockCommunityOrganisations.filter(
      (organisation) => !organisation.isDeployed,
    ).length

    const deployedCommunityOrgs = mockCommunityOrganisations.filter(
      (organisation) => organisation.isDeployed,
    ).length

    const volunteerSlotsFilled = mockVolunteerTasks.reduce(
      (total, task) => total + task.slotsFilled,
      0,
    )

    const volunteerSlotsTotal = mockVolunteerTasks.reduce(
      (total, task) => total + task.slotsTotal,
      0,
    )

    const hospitalBedsAvailable = hospitals.reduce(
      (total, hospital) => total + hospital.availableBeds,
      0,
    )

    const hospitalBedsTotal = hospitals.reduce(
      (total, hospital) => total + hospital.totalBeds,
      0,
    )

    const criticalHospitals = hospitals.filter(
      (hospital) => hospital.status === 'critical',
    ).length

    const criticalTasks = mockVolunteerTasks.filter(
      (task) => task.urgency === 'Critical',
    ).length

    return {
      community: {
        value: mockCommunityOrganisations.length,
        detail: `${activeCommunityOrgs} active · ${deployedCommunityOrgs} deployed`,
      },
      volunteers: {
        value: `${volunteerSlotsFilled}/${volunteerSlotsTotal}`,
        detail: `${summary.totals.deployed.toLocaleString()} resources currently deployed`,
      },
      hospitals: {
        value: `${hospitalBedsAvailable}/${hospitalBedsTotal}`,
        detail: `${criticalHospitals} hospitals critically low`,
      },
      tasks: {
        value: mockVolunteerTasks.length,
        detail: `${criticalTasks} critical urgency`,
      },
    }
  }, [hospitals, summary.totals.deployed])

  async function handleRefreshAll() {
    try {
      setError(null)
      setIsRefreshing(true)

      try {
        await syncResources()
      } catch {
        // Sync can fail during demo if backend is unavailable.
      }

      try {
        const [nextSummary, nextOutlets] = await Promise.all([
          fetchResourceSummary(),
          fetchResourceOutlets(),
        ])

        setSummary(nextSummary)
        setOutlets(nextOutlets)
      } catch {
        setError(
          'Unable to refresh backend resources. Mock community and volunteer data are still shown.',
        )
      }

      const now = new Date().toISOString()

      setHospitalRefreshTimes((currentTimes) => {
        const nextTimes = { ...currentTimes }

        hospitals.forEach((hospital, index) => {
          const shouldRefresh = index % 2 === 0 || Math.random() > 0.45

          if (shouldRefresh) {
            nextTimes[hospital.id] = now
          }
        })

        return nextTimes
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Stack gap="6">
      <Flex
        align={{ base: 'stretch', lg: 'start' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading size="3xl" color="gray.900">
            Resource Management
          </Heading>

          <Text color="gray.500" mt="1">
            Manage community organisations, hospital capacity, and volunteer
            tasks
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'flex-start', lg: 'start' }}
          bg="blue.900"
          color="white"
          disabled={isRefreshing}
          onClick={handleRefreshAll}
          _hover={{
            bg: 'blue.800',
          }}
        >
          <Icon as={RefreshCw} />
          {isRefreshing ? 'Refreshing' : 'Refresh All'}
        </Button>
      </Flex>

      {error && (
        <Box bg="orange.50" borderColor="orange.200" borderWidth="1px" p="4">
          <Text color="orange.700" fontWeight="800">
            {error}
          </Text>
        </Box>
      )}

      <Box
        display="grid"
        gap="4"
        gridTemplateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          xl: 'repeat(4, 1fr)',
        }}
      >
        <OrganisationSummaryCard
          label="Community Organisations"
          value={summaryCards.community.value}
          detail={summaryCards.community.detail}
        />

        <OrganisationSummaryCard
          label="Total Volunteer Pool"
          value={summaryCards.volunteers.value}
          detail={summaryCards.volunteers.detail}
        />

        <OrganisationSummaryCard
          label="Hospital Capacity"
          value={summaryCards.hospitals.value}
          detail={summaryCards.hospitals.detail}
        />

        <OrganisationSummaryCard
          label="Open Volunteer Tasks"
          value={summaryCards.tasks.value}
          detail={summaryCards.tasks.detail}
        />
      </Box>

      <OrganisationSectionFilterBar
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />

      {selectedSection === 'Community Organisations' && (
        <CommunityOrganisationsSection
          filterOptions={communityFilterOptions}
          selectedFilter={selectedCommunityFilter}
          onSelectFilter={setSelectedCommunityFilter}
          organisations={filteredCommunityOrganisations}
        />
      )}

      {selectedSection === 'Hospitals' && (
        <HospitalsSection hospitals={hospitals} />
      )}

      {selectedSection === 'Volunteer Tasks' && (
        <VolunteerTasksSection
          filters={volunteerTaskFilters}
          organisationOptions={volunteerOrganisationOptions}
          onChangeFilters={setVolunteerTaskFilters}
          tasks={filteredVolunteerTasks}
        />
      )}
    </Stack>
  )
}

type CommunityOrganisationsSectionProps = {
  filterOptions: Array<{
    label: CommunityOrganisationFilter
    count: number
  }>
  selectedFilter: CommunityOrganisationFilter
  onSelectFilter: (filter: CommunityOrganisationFilter) => void
  organisations: CommunityOrganisation[]
}

function CommunityOrganisationsSection({
  filterOptions,
  selectedFilter,
  onSelectFilter,
  organisations,
}: CommunityOrganisationsSectionProps) {
  return (
    <Stack bg="white" borderColor="gray.200" borderWidth="1px" gap="4" p="4">
      <CommunityOrganisationFilterBar
        filters={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={onSelectFilter}
      />

      <Box>
        <Box
          display={{ base: 'none', xl: 'grid' }}
          gap="4"
          gridTemplateColumns="2fr 1fr 1fr 1fr 1fr"
          px="4"
          py="3"
        >
          <HeaderText>Organisation</HeaderText>
          <HeaderText>Type</HeaderText>
          <HeaderText>Capacity</HeaderText>
          <HeaderText>Tasks</HeaderText>
          <HeaderText>Status</HeaderText>
        </Box>

        {organisations.length === 0 ? (
          <Box borderTopColor="gray.100" borderTopWidth="1px" px="4" py="8">
            <Text color="gray.500">
              No community organisations found for this filter.
            </Text>
          </Box>
        ) : (
          organisations.map((organisation) => (
            <GovernmentOrganisationCard
              key={organisation.id}
              organisation={organisation}
            />
          ))
        )}
      </Box>
    </Stack>
  )
}

function HospitalsSection({ hospitals }: { hospitals: Hospital[] }) {
  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="4">
      <Box
        display="grid"
        gap="4"
        gridTemplateColumns={{ base: '1fr', xl: 'repeat(3, 1fr)' }}
      >
        {hospitals.map((hospital) => (
          <HospitalCard key={hospital.id} hospital={hospital} />
        ))}
      </Box>
    </Box>
  )
}

type VolunteerTasksSectionProps = {
  filters: VolunteerTaskFilterState
  organisationOptions: string[]
  onChangeFilters: (filters: VolunteerTaskFilterState) => void
  tasks: VolunteerTask[]
}

function VolunteerTasksSection({
  filters,
  organisationOptions,
  onChangeFilters,
  tasks,
}: VolunteerTasksSectionProps) {
  return (
    <Stack gap="4">
      <VolunteerTaskFilterBar
        filters={filters}
        organisationOptions={organisationOptions}
        onChangeFilters={onChangeFilters}
      />

      <Box bg="white" borderColor="gray.200" borderWidth="1px">
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          gap="3"
          justify="space-between"
          p="4"
        >
          <Text color="gray.500" fontSize="sm">
            {tasks.length} task{tasks.length === 1 ? '' : 's'} on the public
            volunteer board.
          </Text>
        </Flex>

        <Box
          display={{ base: 'none', xl: 'grid' }}
          gap="4"
          gridTemplateColumns="2fr 1.4fr 1.4fr 0.8fr 1.2fr"
          px="4"
          py="3"
        >
          <HeaderText>Task</HeaderText>
          <HeaderText>Organisation</HeaderText>
          <HeaderText>Date / Time</HeaderText>
          <HeaderText>Urgency</HeaderText>
          <HeaderText>Slots</HeaderText>
        </Box>

        {tasks.length === 0 ? (
          <Box borderTopColor="gray.100" borderTopWidth="1px" px="4" py="8">
            <Text color="gray.500">
              No volunteer tasks found for the selected filters.
            </Text>
          </Box>
        ) : (
          tasks.map((task) => <VolunteerTaskRow key={task.id} task={task} />)
        )}
      </Box>
    </Stack>
  )
}

function HeaderText({ children }: { children: string }) {
  return (
    <Text
      color="gray.500"
      fontSize="xs"
      fontWeight="900"
      textTransform="uppercase"
    >
      {children}
    </Text>
  )
}

function doesVolunteerTaskMatchFilters(
  task: VolunteerTask,
  filters: VolunteerTaskFilterState,
) {
  const matchesOrganisation =
    filters.organisation === 'All' || task.organisation === filters.organisation

  const matchesSchedule =
    filters.schedule === 'All' || task.schedule === filters.schedule

  const matchesUrgency =
    filters.urgency === 'All' || task.urgency === filters.urgency

  return matchesOrganisation && matchesSchedule && matchesUrgency
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}