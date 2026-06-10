import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  HandHeart,
  Heart,
  MapPin,
  Shield,
  Users,
} from 'lucide-react'
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import {
  fetchCommunityEvents,
  type CommunityEvent,
} from '../api/communityEventsApi'

type CommunityFilter = 'all' | 'preparedness' | 'relief' | 'training' | 'volunteer'

const filters: Array<{ icon: typeof Shield; label: string; value: CommunityFilter }> = [
  { icon: Users, label: 'All', value: 'all' },
  { icon: Shield, label: 'Preparedness', value: 'preparedness' },
  { icon: Heart, label: 'Relief', value: 'relief' },
  { icon: BookOpen, label: 'Training', value: 'training' },
  { icon: HandHeart, label: 'Volunteer', value: 'volunteer' },
]

const categoryTone: Record<string, { bg: string; color: string; icon: typeof Shield }> = {
  preparedness: { bg: 'blue.50', color: 'blue.700', icon: Shield },
  relief: { bg: 'red.50', color: 'red.600', icon: Heart },
  training: { bg: 'purple.50', color: 'purple.700', icon: BookOpen },
  volunteer: { bg: 'green.50', color: 'green.700', icon: HandHeart },
}

export function CommunityPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const activeFilter = isCommunityFilter(categoryParam) ? categoryParam : 'all'

  async function loadEvents() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      setEvents(await fetchCommunityEvents())
    } catch {
      setErrorMessage('Unable to load community events.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') {
      return events
    }

    return events.filter((event) => event.category === activeFilter)
  }, [activeFilter, events])

  return (
    <Stack gap="6" maxW="1440px" mx="auto">
      <Box>
        <HStack color="green.700" gap="2" mb="2">
          <Icon as={Users} boxSize="5" />
          <Text fontSize="sm" fontWeight="800" letterSpacing="0.12em">
            COMMUNITY RESILIENCE
          </Text>
        </HStack>
        <Heading color="gray.900" size="3xl">
          Communities
        </Heading>
        <Text color="gray.600" mt="2">
          Workshops, training, and relief activities organised near you.
        </Text>
      </Box>

      <Box bg="blue.950" color="white" p="6">
        <Heading color="white" size="md">
          Community Resilience Hub
        </Heading>
        <Text color="blue.100" fontWeight="700" mt="3" maxW="780px">
          Volunteer, train, and support relief activities organised by community
          groups and agencies near you.
        </Text>
      </Box>

      <HStack gap="3" overflowX="auto">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value

          return (
            <Button
              key={filter.value}
              bg={isActive ? 'blue.950' : 'white'}
              borderColor={isActive ? 'blue.950' : 'gray.200'}
              borderWidth="1px"
              color={isActive ? 'white' : 'gray.600'}
              minW="fit-content"
              onClick={() => {
                if (filter.value === 'all') {
                  setSearchParams({})
                  return
                }

                setSearchParams({ category: filter.value })
              }}
              rounded="full"
              _hover={{ bg: isActive ? 'blue.950' : 'gray.50' }}
            >
              <Icon as={filter.icon} />
              {filter.label}
            </Button>
          )
        })}
      </HStack>

      {errorMessage && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" p="4">
          <Text color="red.700" fontWeight="700">
            {errorMessage}
          </Text>
        </Box>
      )}

      {isLoading ? (
        <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
          <Text color="gray.500">Loading community events...</Text>
        </Box>
      ) : filteredEvents.length === 0 ? (
        <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
          <Text color="gray.500">No community events found.</Text>
        </Box>
      ) : (
        <Box
          display="grid"
          gap="4"
          gridTemplateColumns={{ base: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}
        >
          {filteredEvents.map((event) => (
            <CommunityEventCard key={event.id} event={event} />
          ))}
        </Box>
      )}
    </Stack>
  )
}

function CommunityEventCard({ event }: { event: CommunityEvent }) {
  const descriptionParts = getEventDescriptionParts(event.description)
  const tone = categoryTone[event.category] ?? {
    bg: 'gray.100',
    color: 'gray.700',
    icon: Users,
  }

  return (
    <Stack bg="white" borderColor="gray.200" borderWidth="1px" gap="4" p="5">
      <Flex align="start" justify="space-between" gap="4">
        <Stack gap="2" minW="0">
          <Heading color="gray.900" lineHeight="1.25" size="md">
            {event.title}
          </Heading>
          <Badge alignSelf="flex-start" bg="green.50" color="green.700" px="3" py="1">
            {event.organiserName}
          </Badge>
        </Stack>
        <Badge bg={tone.bg} color={tone.color} px="3" py="1">
          <Icon as={tone.icon} boxSize="4" />
          {toTitleCase(event.category)}
        </Badge>
      </Flex>

      {descriptionParts.body && (
        <Text color="gray.600" fontSize="sm" lineHeight="1.7">
          {descriptionParts.body}
        </Text>
      )}

      <Stack color="gray.500" fontSize="sm" gap="2">
        <HStack gap="2">
          <Icon as={MapPin} boxSize="4" />
          <Text>{event.location ?? 'Location to be confirmed'}</Text>
        </HStack>
        <HStack gap="2">
          <Icon as={Clock} boxSize="4" />
          <Text>{formatDateRange(event.startAt, event.endAt)}</Text>
        </HStack>
      </Stack>

      <HStack gap="2" wrap="wrap">
        {descriptionParts.tags.map((tag) => (
          <Badge key={tag} bg="gray.100" color="gray.600" px="3" py="1">
            {tag}
          </Badge>
        ))}
        <Badge bg="gray.100" color="gray.600" px="3" py="1">
          {event.isFree ? 'Free' : 'Paid'}
        </Badge>
        {event.region && (
          <Badge bg="gray.100" color="gray.600" px="3" py="1">
            {event.region}
          </Badge>
        )}
      </HStack>
    </Stack>
  )
}

function isCommunityFilter(value: string | null): value is CommunityFilter {
  return filters.some((filter) => filter.value === value)
}

function getEventDescriptionParts(description: string | null) {
  if (!description) {
    return { body: '', tags: [] }
  }

  const [body, tagsText] = description.split('Tags:')
  const tags = tagsText
    ? tagsText
        .split(',')
        .map((tag) => tag.trim().replace(/\.$/, ''))
        .filter(Boolean)
    : []

  return { body: body.trim(), tags }
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDateRange(startAt: string | null, endAt: string | null) {
  if (!startAt) {
    return 'Time to be confirmed'
  }

  const start = new Date(startAt)
  const end = endAt ? new Date(endAt) : null

  if (Number.isNaN(start.getTime())) {
    return startAt
  }

  const day = new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(start)
  const startTime = formatTime(start)
  const endTime = end && !Number.isNaN(end.getTime()) ? formatTime(end) : null

  return endTime ? `${day} - ${startTime} - ${endTime}` : `${day} - ${startTime}`
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
