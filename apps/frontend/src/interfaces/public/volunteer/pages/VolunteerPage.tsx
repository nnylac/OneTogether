import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Clock,
  HandHeart,
  MapPin,
  RefreshCcw,
  ShieldCheck,
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
  fetchVolunteerOpportunities,
  type VolunteerOpportunity,
} from '../api/volunteerOpportunitiesApi'

const urgencyTone = {
  critical: { bg: 'red.50', border: 'red.200', color: 'red.600' },
  normal: { bg: 'gray.100', border: 'gray.200', color: 'gray.700' },
  urgent: { bg: 'orange.50', border: 'orange.200', color: 'orange.600' },
}

export function VolunteerPage() {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function loadOpportunities() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      setOpportunities(await fetchVolunteerOpportunities())
    } catch {
      setErrorMessage('Unable to load volunteer opportunities.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOpportunities()
  }, [])

  const urgentCount = useMemo(
    () =>
      opportunities.filter(
        (opportunity) => opportunity.urgency === 'critical' || opportunity.urgency === 'urgent',
      ).length,
    [opportunities],
  )

  return (
    <Stack gap="6" maxW="1440px" mx="auto">
      <Flex
        align={{ base: 'stretch', lg: 'end' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <HStack color="green.700" gap="2" mb="2">
            <Icon as={HandHeart} boxSize="5" />
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.12em">
              VOLUNTEER RESPONSE
            </Text>
          </HStack>
          <Heading color="gray.900" size="3xl">
            Volunteer
          </Heading>
          <Text color="gray.600" mt="2">
            Emergency support tasks from verified volunteer organisations.
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'stretch', lg: 'auto' }}
          bg="green.600"
          color="white"
          onClick={() => void loadOpportunities()}
          _hover={{ bg: 'green.700' }}
        >
          <Icon as={RefreshCcw} />
          Refresh
        </Button>
      </Flex>

      <Flex bg="green.600" color="white" justify="space-between" gap="6" p="6">
        <Stack gap="2">
          <Text fontSize="xl" fontWeight="800">
            Be part of the response
          </Text>
          <Text color="green.50" maxW="760px">
            Sign up for a specific task below, or register your skills with the
            listed organisation for future deployment.
          </Text>
        </Stack>
        <Stack align="end" gap="0" minW="140px">
          <Text fontSize="3xl" fontWeight="900">
            {urgentCount}
          </Text>
          <Text color="green.50" fontSize="sm" fontWeight="700">
            urgent tasks
          </Text>
        </Stack>
      </Flex>

      <HStack color="gray.600" gap="2">
        <Icon as={ShieldCheck} boxSize="5" color="orange.500" />
        <Text fontSize="xs" fontWeight="800" letterSpacing="0.16em">
          URGENTLY NEEDED
        </Text>
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
          <Text color="gray.500">Loading volunteer opportunities...</Text>
        </Box>
      ) : opportunities.length === 0 ? (
        <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
          <Text color="gray.500">No volunteer opportunities are open.</Text>
        </Box>
      ) : (
        <Box
          display="grid"
          gap="4"
          gridTemplateColumns={{ base: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }}
        >
          {opportunities.map((opportunity) => (
            <VolunteerOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </Box>
      )}
    </Stack>
  )
}

function VolunteerOpportunityCard({
  opportunity,
}: {
  opportunity: VolunteerOpportunity
}) {
  const progressPercent = Math.min(
    Math.max((opportunity.slotProgress ?? 0) * 100, 0),
    100,
  )
  const tone = urgencyTone[opportunity.urgency]

  return (
    <Stack bg="white" borderColor="gray.200" borderWidth="1px" gap="4" p="5">
      <Flex align="start" justify="space-between" gap="4">
        <Stack gap="2" minW="0">
          <Heading color="gray.900" lineHeight="1.25" size="md">
            {opportunity.title}
          </Heading>
          <HStack color="green.700" fontSize="sm" fontWeight="700">
            <Icon as={Building2} boxSize="4" />
            <Text>{opportunity.source.sourceName}</Text>
          </HStack>
        </Stack>
        <Badge
          bg={tone.bg}
          borderColor={tone.border}
          borderWidth="1px"
          color={tone.color}
          px="3"
          py="1"
          textTransform="uppercase"
        >
          {opportunity.urgency}
        </Badge>
      </Flex>

      <Stack color="gray.500" fontSize="sm" gap="2">
        <HStack gap="2">
          <Icon as={MapPin} boxSize="4" />
          <Text>{opportunity.location ?? 'Location to be confirmed'}</Text>
        </HStack>
        <HStack gap="2">
          <Icon as={Clock} boxSize="4" />
          <Text>{formatDateRange(opportunity.startAt, opportunity.endAt)}</Text>
        </HStack>
      </Stack>

      <HStack gap="2" wrap="wrap">
        {getVolunteerTags(opportunity).map((tag) => (
          <Badge key={tag} bg="gray.100" color="gray.600" px="3" py="1">
            {tag}
          </Badge>
        ))}
      </HStack>

      <Stack gap="2">
        <Flex justify="space-between" gap="3">
          <Text color="gray.500" fontSize="sm">
            {opportunity.slotsFilled}
            {opportunity.slotsTotal ? `/${opportunity.slotsTotal}` : ''} slots
            filled
          </Text>
          <Text color="green.700" fontSize="sm" fontWeight="800">
            {opportunity.slotsLeft ?? 'Open'} left
          </Text>
        </Flex>
        <Box bg="gray.100" h="2">
          <Box bg="orange.400" h="2" w={`${progressPercent}%`} />
        </Box>
      </Stack>

      <Button asChild alignSelf="flex-start" color="green.700" variant="ghost">
        <a href={opportunity.signupUrl} rel="noreferrer" target="_blank">
          Tap to sign up
        </a>
      </Button>
    </Stack>
  )
}

function getVolunteerTags(opportunity: VolunteerOpportunity) {
  const descriptionTags =
    opportunity.description
      ?.split('Tags:')[1]
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  const fallbackTags = [
    opportunity.opportunityType,
    opportunity.requiresTraining ? 'Training preferred' : 'No prior experience',
  ].filter((tag): tag is string => Boolean(tag))

  return descriptionTags.length > 0 ? descriptionTags : fallbackTags
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
