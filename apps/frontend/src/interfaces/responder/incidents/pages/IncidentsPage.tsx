import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import { BackToDashboardLink } from '../../components/BackToDashboardLink'
import { fetchIncidents } from '../api/incidentsApi'
import { IncidentStatusBadge } from '../components/IncidentStatusBadge'
import type { Incident } from '../types'

type IncidentFilter = 'all' | 'active' | 'critical'

const pageSize = 6

const filterLabels: Record<IncidentFilter, string> = {
  all: 'All incidents',
  active: 'Active',
  critical: 'Critical',
}

function getFilteredIncidents(filter: IncidentFilter, incidents: Incident[]) {
  if (filter === 'active') {
    return incidents.filter((incident) => incident.status !== 'closed')
  }

  if (filter === 'critical') {
    return incidents.filter((incident) => incident.isCritical)
  }

  return incidents
}

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    async function loadIncidents() {
      try {
        setError(null)
        setIsLoading(true)
        const nextIncidents = await fetchIncidents()

        if (isMounted) {
          setIncidents(nextIncidents)
        }
      } catch {
        if (isMounted) {
          setError('Unable to load incidents from the backend.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadIncidents()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredIncidents = useMemo(
    () => getFilteredIncidents(filter, incidents),
    [filter, incidents],
  )
  const pageCount = Math.max(Math.ceil(filteredIncidents.length / pageSize), 1)
  const pageStart = (page - 1) * pageSize
  const visibleIncidents = filteredIncidents.slice(pageStart, pageStart + pageSize)

  const counts = {
    all: incidents.length,
    active: incidents.filter((incident) => incident.status !== 'closed').length,
    critical: incidents.filter((incident) => incident.isCritical).length,
  }

  function selectFilter(nextFilter: IncidentFilter) {
    setFilter(nextFilter)
    setPage(1)
  }

  return (
    <Stack gap="6">
      <Flex justify="space-between" align={{ base: 'stretch', lg: 'end' }} gap="4" direction={{ base: 'column', lg: 'row' }}>
        <Box>
          <BackToDashboardLink />
          <Heading size="3xl" color="gray.900">
            Incidents
          </Heading>
          <Text color="gray.600" mt="1">
            Select an incident to view more details
          </Text>
        </Box>

        <HStack gap="2" wrap="wrap">
          {(Object.keys(filterLabels) as IncidentFilter[]).map((filterKey) => {
            const isSelected = filter === filterKey

            return (
              <Button
                key={filterKey}
                variant={isSelected ? 'solid' : 'outline'}
                bg={isSelected ? 'gray.900' : 'white'}
                color={isSelected ? 'white' : 'gray.700'}
                borderColor="gray.300"
                _hover={{ bg: isSelected ? 'gray.800' : 'gray.50' }}
                onClick={() => selectFilter(filterKey)}
              >
                {filterLabels[filterKey]} ({counts[filterKey]})
              </Button>
            )
          })}
        </HStack>
      </Flex>

      {error && (
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" color="red.700" p="4">
          <Text fontWeight="700">{error}</Text>
        </Box>
      )}

      <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
        <Box as="table" width="100%" borderCollapse="collapse" tableLayout="fixed" minW="900px">
          <Box as="colgroup">
            <Box as="col" width="51%" />
            <Box as="col" width="16%" />
            <Box as="col" width="18%" />
            <Box as="col" width="15%" />
          </Box>

          <Box as="thead" bg="gray.50">
            <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
              <HeaderCell>Incident</HeaderCell>
              <HeaderCell textAlign="center">Status</HeaderCell>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell textAlign="right">Open room</HeaderCell>
            </Box>
          </Box>

          <Box as="tbody">
            {isLoading && (
              <Box as="tr">
                <td colSpan={4}>
                  <Box px="5" py="6">
                    <Text color="gray.500">Loading incidents...</Text>
                  </Box>
                </td>
              </Box>
            )}

            {!isLoading && visibleIncidents.length === 0 && (
              <Box as="tr">
                <td colSpan={4}>
                  <Box px="5" py="6">
                    <Text color="gray.500">No incidents found.</Text>
                  </Box>
                </td>
              </Box>
            )}

            {!isLoading && visibleIncidents.map((incident) => (
              <Box
                key={incident.id}
                as="tr"
                borderBottomWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: 'gray.50' }}
              >
                <BodyCell>
                  <VStack gap="1" align="stretch">
                    <Text color="gray.900" fontSize="lg" fontWeight="700">
                      {incident.title}
                    </Text>
                    <Text color="gray.500" fontSize="sm" fontWeight="700">
                      {incident.location}
                    </Text>
                    <Text
                      color="gray.500"
                      display="-webkit-box"
                      fontSize="sm"
                      overflow="hidden"
                      style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                    >
                      {incident.description}
                    </Text>
                  </VStack>
                </BodyCell>

                <BodyCell textAlign="center">
                  <IncidentStatusBadge status={incident.status} />
                </BodyCell>

                <BodyCell>
                  <Text color="gray.600">{incident.date}</Text>
                </BodyCell>

                <BodyCell textAlign="right">
                  <Button asChild bg="gray.900" color="white" minW="28" _hover={{ bg: 'gray.800' }}>
                    <Link to={`/responder/incidents/${incident.id}/room`}>
                      <Icon as={ExternalLink} />
                      Open room
                    </Link>
                  </Button>
                </BodyCell>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Flex justify="space-between" align="center" gap="4" direction={{ base: 'column', md: 'row' }}>
        <Text color="gray.500" fontSize="sm">
          Showing {filteredIncidents.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + pageSize, filteredIncidents.length)} of{' '}
          {filteredIncidents.length} incidents
        </Text>

        <HStack gap="2">
          <Button
            variant="outline"
            borderColor="gray.300"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
          >
            <Icon as={ChevronLeft} />
            Previous
          </Button>

          <Text color="gray.700" fontWeight="700" minW="16" textAlign="center">
            {page} / {pageCount}
          </Text>

          <Button
            variant="outline"
            borderColor="gray.300"
            disabled={page === pageCount}
            onClick={() => setPage((currentPage) => Math.min(currentPage + 1, pageCount))}
          >
            Next
            <Icon as={ChevronRight} />
          </Button>
        </HStack>
      </Flex>
    </Stack>
  )
}

function HeaderCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box
      as="th"
      color="gray.500"
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0"
      px={textAlign === 'right' ? '3' : '5'}
      py="3"
      textAlign={textAlign}
      textTransform="uppercase"
    >
      {children}
    </Box>
  )
}

function BodyCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box
      as="td"
      px={textAlign === 'right' ? '3' : '5'}
      py="4"
      textAlign={textAlign}
      verticalAlign="middle"
    >
      {children}
    </Box>
  )
}
