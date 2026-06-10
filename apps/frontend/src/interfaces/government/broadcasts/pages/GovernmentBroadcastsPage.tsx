import { useEffect, useMemo, useState } from 'react'
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
import { useAuth } from '../../../auth/useAuth'
import {
  archiveBroadcast,
  fetchGovernmentBroadcasts,
  publishNewBroadcast,
} from '../api/broadcastsApi'
import { BroadcastFilterBar } from '../components/BroadcastFilterBar'
import { BroadcastFormDrawer } from '../components/BroadcastFormDrawer'
import { BroadcastList } from '../components/BroadcastList'
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
  const { user } = useAuth()
  const [broadcasts, setBroadcasts] = useState<GovernmentBroadcast[]>([])
  const [selectedFilter, setSelectedFilter] = useState<BroadcastFilter>('All')
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function loadBroadcasts({ showLoading = false } = {}) {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const nextBroadcasts = await fetchGovernmentBroadcasts()
      setBroadcasts(nextBroadcasts)
      setErrorMessage(null)
    } catch {
      setErrorMessage('Unable to load published broadcasts.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBroadcasts({ showLoading: true })
  }, [])

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

  async function handlePublishBroadcast(newBroadcast: NewBroadcastInput) {
    try {
      const broadcast = await publishNewBroadcast(newBroadcast, user?.id)
      setBroadcasts((currentBroadcasts) => [broadcast, ...currentBroadcasts])
      setSelectedFilter('All')
      setIsCreatePanelOpen(false)
      setErrorMessage(null)
    } catch {
      setErrorMessage('Unable to publish broadcast.')
      throw new Error('Unable to publish broadcast')
    }
  }

  async function handleDeleteBroadcast(broadcastId: string) {
    try {
      await archiveBroadcast(broadcastId)
      setBroadcasts((currentBroadcasts) =>
        currentBroadcasts.filter((broadcast) => broadcast.id !== broadcastId),
      )
      setErrorMessage(null)
    } catch {
      setErrorMessage('Unable to archive broadcast.')
    }
  }

  function handleRefreshBroadcasts() {
    void loadBroadcasts({ showLoading: true })
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

      {errorMessage && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" p="4">
          <Text color="red.700" fontWeight="700">
            {errorMessage}
          </Text>
        </Box>
      )}

      <BroadcastList
        title={getBroadcastListTitle(selectedFilter)}
        broadcasts={filteredBroadcasts}
        isLoading={isLoading}
        onDelete={handleDeleteBroadcast}
        onRefresh={handleRefreshBroadcasts}
      />
    </Stack>
  )
}
