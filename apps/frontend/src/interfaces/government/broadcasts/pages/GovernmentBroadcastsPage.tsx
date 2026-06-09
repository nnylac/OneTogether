import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { BroadcastFilterBar } from '../components/BroadcastFilterBar'
import { BroadcastFormDrawer } from '../components/BroadcastFormDrawer'
import { BroadcastList } from '../components/BroadcastList'
import { sampleGovernmentBroadcasts } from '../data/sampleGovernmentBroadcasts'
import type {
  BroadcastFilter,
  GovernmentBroadcast,
  NewBroadcastInput,
} from '../types/broadcast'

const broadcastFilters: BroadcastFilter[] = [
  'All',
  'Public',
  'Responders',
  'Zone',
  'info',
  'advisory',
  'warning',
  'critical',
]

const broadcastFilterLabels: Record<BroadcastFilter, string> = {
  All: 'All',
  Public: 'Public',
  Responders: 'Responders',
  Zone: 'Zone',
  info: 'Info',
  advisory: 'Advisory',
  warning: 'Warning',
  critical: 'Critical',
}

function getCurrentBroadcastTime() {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function doesBroadcastMatchFilter(
  broadcast: GovernmentBroadcast,
  selectedFilter: BroadcastFilter,
) {
  if (selectedFilter === 'All') {
    return true
  }

  return (
    broadcast.audience === selectedFilter ||
    broadcast.severity === selectedFilter
  )
}

function countBroadcastsForFilter(
  broadcasts: GovernmentBroadcast[],
  filter: BroadcastFilter,
) {
  return broadcasts.filter((broadcast) =>
    doesBroadcastMatchFilter(broadcast, filter),
  ).length
}

function getBroadcastListTitle(selectedFilter: BroadcastFilter) {
  if (selectedFilter === 'All') {
    return 'All Broadcasts'
  }

  return `${broadcastFilterLabels[selectedFilter]} Broadcasts`
}

export function GovernmentBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<GovernmentBroadcast[]>(
    sampleGovernmentBroadcasts,
  )
  const [selectedFilter, setSelectedFilter] = useState<BroadcastFilter>('All')
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)

  const filterOptions = useMemo(() => {
    return broadcastFilters.map((filter) => ({
      label: broadcastFilterLabels[filter],
      value: filter,
      count: countBroadcastsForFilter(broadcasts, filter),
    }))
  }, [broadcasts])

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((broadcast) =>
      doesBroadcastMatchFilter(broadcast, selectedFilter),
    )
  }, [broadcasts, selectedFilter])

  function handlePublishBroadcast(newBroadcast: NewBroadcastInput) {
    const broadcast: GovernmentBroadcast = {
      id: `broadcast-${Date.now()}`,
      title: newBroadcast.title,
      message: newBroadcast.message,
      audience: newBroadcast.audience,
      zone: newBroadcast.audience === 'Zone' ? newBroadcast.zone : undefined,
      responderOrganisationIds:
        newBroadcast.audience === 'Responders'
          ? newBroadcast.responderOrganisationIds
          : undefined,
      responderOrganisationNames:
        newBroadcast.audience === 'Responders'
          ? newBroadcast.responderOrganisationNames
          : undefined,
      severity: newBroadcast.severity,
      authorName: 'Raj Kumar',
      createdAt: getCurrentBroadcastTime(),
    }

    setBroadcasts((currentBroadcasts) => [broadcast, ...currentBroadcasts])
    setSelectedFilter('All')
    setIsCreatePanelOpen(false)
  }

  function handleDeleteBroadcast(broadcastId: string) {
    setBroadcasts((currentBroadcasts) =>
      currentBroadcasts.filter((broadcast) => broadcast.id !== broadcastId),
    )
  }

  function handleRefreshBroadcasts() {
    setBroadcasts(sampleGovernmentBroadcasts)
    setSelectedFilter('All')
  }

  return (
    <Stack gap="6">
      <Flex
        align={{ base: 'stretch', lg: 'center' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading size="3xl" color="gray.900">
            Broadcast Management
          </Heading>

          <Text color="gray.500" mt="1">
            Create, manage, and publish emergency communications
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'flex-start', lg: 'center' }}
          bg="blue.900"
          color="white"
          onClick={() => setIsCreatePanelOpen((isOpen) => !isOpen)}
          _hover={{
            bg: 'blue.800',
          }}
        >
          <Icon as={Plus} />
          New Broadcast
        </Button>
      </Flex>

      <BroadcastFilterBar
        filters={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      <BroadcastFormDrawer
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        onPublish={handlePublishBroadcast}
      />

      <BroadcastList
        title={getBroadcastListTitle(selectedFilter)}
        broadcasts={filteredBroadcasts}
        onDelete={handleDeleteBroadcast}
        onRefresh={handleRefreshBroadcasts}
      />
    </Stack>
  )
}
