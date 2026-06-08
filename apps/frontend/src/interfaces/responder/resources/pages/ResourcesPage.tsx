import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { BackToDashboardLink } from '../../components/BackToDashboardLink'
import {
  fetchResourceOutlets,
  fetchResourceSummary,
  syncResources,
} from '../api/resourcesApi'
import type {
  ResourceFilters,
  ResourceOutlet,
  ResourceStatus,
  ResourceSummary,
  ResourceTotals,
} from '../api/resourcesApi'

type StatusFilter = 'all' | ResourceStatus

const statusLabels: Record<ResourceStatus, string> = {
  healthy: 'Healthy',
  strained: 'Strained',
  critical: 'Critical',
}

const statusStyles: Record<ResourceStatus, { bg: string; color: string }> = {
  healthy: { bg: 'green.50', color: 'green.700' },
  strained: { bg: 'orange.50', color: 'orange.700' },
  critical: { bg: 'red.50', color: 'red.700' },
}

const progressColors: Record<ResourceStatus, string> = {
  healthy: 'green.500',
  strained: 'orange.400',
  critical: 'red.500',
}

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

export function ResourcesPage() {
  const [agencyId, setAgencyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [outletType, setOutletType] = useState('')
  const [outlets, setOutlets] = useState<ResourceOutlet[]>([])
  const [region, setRegion] = useState('')
  const [resourceCategory, setResourceCategory] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [summary, setSummary] = useState<ResourceSummary>(emptySummary)

  const filters = useMemo<ResourceFilters>(
    () => ({
      agencyId: agencyId || undefined,
      outletType: outletType || undefined,
      region: region || undefined,
      resourceCategory: resourceCategory || undefined,
    }),
    [agencyId, outletType, region, resourceCategory],
  )

  useEffect(() => {
    let isMounted = true

    async function loadResources() {
      try {
        setError(null)
        setIsLoading(true)
        const [nextSummary, nextOutlets] = await Promise.all([
          fetchResourceSummary(filters),
          fetchResourceOutlets(filters),
        ])

        if (isMounted) {
          setSummary(nextSummary)
          setOutlets(nextOutlets)
        }
      } catch {
        if (isMounted) {
          setError('Unable to load resource data from the backend.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadResources()

    return () => {
      isMounted = false
    }
  }, [filters])

  const allFilterOptions = useMemo(() => getFilterOptions(outlets), [outlets])
  const visibleOutlets = useMemo(
    () => filterOutlets(outlets, search, status),
    [outlets, search, status],
  )

  async function handleSync() {
    try {
      setError(null)
      setIsSyncing(true)
      await syncResources()
      const [nextSummary, nextOutlets] = await Promise.all([
        fetchResourceSummary(filters),
        fetchResourceOutlets(filters),
      ])
      setSummary(nextSummary)
      setOutlets(nextOutlets)
    } catch {
      setError('Unable to sync resources from external agencies.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Stack gap="6" maxW="1600px">
      <Flex justify="space-between" align={{ base: 'stretch', lg: 'end' }} gap="4" direction={{ base: 'column', lg: 'row' }}>
        <Stack gap="1">
          <BackToDashboardLink />
          <Heading size="3xl" color="gray.900">
            Resources
          </Heading>
          <Text color="gray.600">
            Agency outlet capacity and resource availability.
          </Text>
        </Stack>

        <Button
          alignSelf={{ base: 'stretch', sm: 'start', lg: 'end' }}
          bg="gray.900"
          color="white"
          disabled={isSyncing}
          onClick={handleSync}
          _hover={{ bg: 'gray.800' }}
        >
          <Icon as={RefreshCw} />
          {isSyncing ? 'Syncing' : 'Sync now'}
        </Button>
      </Flex>

      {error && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" color="red.700" p="4">
          <Text fontWeight="700">{error}</Text>
        </Box>
      )}

      <SummarySection summary={summary} />

      <Card.Root bg="white" borderColor="gray.200" borderRadius="sm" borderWidth="1px">
        <Card.Body>
          <Stack gap="4">
            <Flex gap="3" wrap="wrap">
              <Box minW={{ base: 'full', md: '220px' }} flex="1">
                <FilterLabel>Agency</FilterLabel>
                <Select value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
                  <option value="">All agencies</option>
                  {allFilterOptions.agencies.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box minW={{ base: 'full', md: '220px' }} flex="1">
                <FilterLabel>Outlet type</FilterLabel>
                <Select value={outletType} onChange={(event) => setOutletType(event.target.value)}>
                  <option value="">All outlet types</option>
                  {allFilterOptions.outletTypes.map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box minW={{ base: 'full', md: '180px' }} flex="1">
                <FilterLabel>Region</FilterLabel>
                <Select value={region} onChange={(event) => setRegion(event.target.value)}>
                  <option value="">All regions</option>
                  {allFilterOptions.regions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box minW={{ base: 'full', md: '200px' }} flex="1">
                <FilterLabel>Category</FilterLabel>
                <Select value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)}>
                  <option value="">All categories</option>
                  {allFilterOptions.categories.map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box minW={{ base: 'full', md: '180px' }} flex="1">
                <FilterLabel>Status</FilterLabel>
                <Select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                  <option value="all">All statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="strained">Strained</option>
                  <option value="critical">Critical</option>
                </Select>
              </Box>
            </Flex>

            <Box position="relative">
              <Icon
                as={Search}
                boxSize="17px"
                color="gray.400"
                left="4"
                position="absolute"
                top="50%"
                transform="translateY(-50%)"
                zIndex="1"
              />
              <Input
                bg="white"
                borderColor="gray.300"
                h="44px"
                onChange={(event) => setSearch(event.target.value)}
                pl="11"
                placeholder="Search outlet, agency, region, or resource"
                value={search}
              />
            </Box>
          </Stack>
        </Card.Body>
      </Card.Root>

      <CriticalOutlets outlets={summary.criticalOutlets} />

      <ResourceTable isLoading={isLoading} outlets={visibleOutlets} />
    </Stack>
  )
}

function SummarySection({ summary }: { summary: ResourceSummary }) {
  const availability = getPercent(summary.totals.available, summary.totals.total)
  const status = getStatus(summary.totals)

  return (
    <Box display="grid" gap="4" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }}>
      <SummaryCard label="Availability" value={`${availability}%`} detail={`${summary.totals.available.toLocaleString()} of ${summary.totals.total.toLocaleString()} available`} status={status} />
      <SummaryCard label="Deployed" value={summary.totals.deployed.toLocaleString()} detail="resources currently in use" status="strained" />
      <SummaryCard label="Maintenance" value={summary.totals.maintenance.toLocaleString()} detail="temporarily unavailable" status={summary.totals.maintenance > 0 ? 'strained' : 'healthy'} />
      <SummaryCard label="Last synced" value={summary.lastSyncedAt ? formatDate(summary.lastSyncedAt) : 'No data'} detail={`${summary.byAgency.length} agencies in view`} status={summary.lastSyncedAt ? 'healthy' : 'critical'} />
    </Box>
  )
}

function SummaryCard({
  detail,
  label,
  status,
  value,
}: {
  detail: string
  label: string
  status: ResourceStatus
  value: string
}) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderRadius="sm" borderWidth="1px">
      <Card.Body>
        <Stack gap="3">
          <Flex justify="space-between" align="start" gap="3">
            <Text color="gray.500" fontSize="xs" fontWeight="800" textTransform="uppercase">
              {label}
            </Text>
            <StatusBadge status={status} />
          </Flex>
          <Text color="gray.900" fontSize="2xl" fontWeight="900">
            {value}
          </Text>
          <Text color="gray.500" fontSize="sm">
            {detail}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

function CriticalOutlets({ outlets }: { outlets: ResourceOutlet[] }) {
  if (outlets.length === 0) {
    return null
  }

  return (
    <Card.Root bg="white" borderColor="red.200" borderRadius="sm" borderWidth="1px">
      <Card.Header>
        <Flex justify="space-between" align="center" gap="3">
          <Heading size="md" color="gray.900">
            Critical outlets
          </Heading>
          <Badge bg="red.50" color="red.700">
            {outlets.length}
          </Badge>
        </Flex>
      </Card.Header>
      <Card.Body>
        <HStack gap="3" align="stretch" wrap="wrap">
          {outlets.slice(0, 6).map((outlet) => (
            <Stack key={outlet.id} bg="red.50" borderColor="red.100" borderWidth="1px" gap="1" minW={{ base: 'full', md: '260px' }} p="4">
              <Text color="gray.900" fontWeight="800">
                {outlet.name}
              </Text>
              <Text color="gray.600" fontSize="sm">
                {outlet.agencyId} · {outlet.region ?? 'Unknown region'}
              </Text>
              <Text color="red.700" fontSize="sm" fontWeight="800">
                {getPercent(outlet.totals.available, outlet.totals.total)}% available
              </Text>
            </Stack>
          ))}
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

function ResourceTable({
  isLoading,
  outlets,
}: {
  isLoading: boolean
  outlets: ResourceOutlet[]
}) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderRadius="sm" borderWidth="1px">
      <Card.Header>
        <Flex justify="space-between" align="center" gap="3">
          <Heading size="lg" color="gray.900">
            Outlet inventory
          </Heading>
          <Text color="gray.500" fontSize="sm" fontWeight="700">
            {outlets.length.toLocaleString()} outlets
          </Text>
        </Flex>
      </Card.Header>

      <Card.Body p="0">
        <Box overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" minW="1100px">
            <Box as="thead" bg="gray.50">
              <Box as="tr" borderBottomColor="gray.200" borderBottomWidth="1px">
                <HeaderCell width="30%">Outlet</HeaderCell>
                <HeaderCell width="20%">Resource</HeaderCell>
                <HeaderCell width="20%">Usage</HeaderCell>
                <HeaderCell width="8%" textAlign="right">Available</HeaderCell>
                <HeaderCell width="8%" textAlign="right">Deployed</HeaderCell>
                <HeaderCell width="8%" textAlign="right">Total</HeaderCell>
                <HeaderCell width="6%" textAlign="right">Status</HeaderCell>
              </Box>
            </Box>

            <Box as="tbody">
              {isLoading && (
                <Box as="tr">
                  <td colSpan={7}>
                    <Box px="5" py="6">
                      <Text color="gray.500">Loading resources...</Text>
                    </Box>
                  </td>
                </Box>
              )}

              {!isLoading && outlets.length === 0 && (
                <Box as="tr">
                  <td colSpan={7}>
                    <Box px="5" py="6">
                      <Text color="gray.500">No resources found.</Text>
                    </Box>
                  </td>
                </Box>
              )}

              {!isLoading && outlets.map((outlet) => (
                outlet.resources.length > 0 ? (
                  outlet.resources.map((resource, index) => (
                    <Box key={`${outlet.id}:${resource.id}`} as="tr" borderBottomColor="gray.100" borderBottomWidth="1px" _hover={{ bg: 'gray.50' }}>
                      <BodyCell>
                        {index === 0 && (
                          <Stack gap="1">
                            <Text color="gray.900" fontWeight="800">
                              {outlet.name}
                            </Text>
                            <Text color="gray.500" fontSize="sm">
                              {outlet.agencyId} · {formatLabel(outlet.type)} · {outlet.region ?? 'Unknown region'}
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              Synced {formatDate(outlet.lastSyncedAt)}
                            </Text>
                          </Stack>
                        )}
                      </BodyCell>
                      <BodyCell>
                        <Stack gap="1">
                          <Text color="gray.800" fontWeight="800">
                            {resource.name}
                          </Text>
                          <Text color="gray.500" fontSize="sm">
                            {formatLabel(resource.category)}
                          </Text>
                        </Stack>
                      </BodyCell>
                      <BodyCell>
                        <UsageBar totals={resource} />
                      </BodyCell>
                      <NumberCell>{resource.available}</NumberCell>
                      <NumberCell>{resource.deployed}</NumberCell>
                      <NumberCell>{resource.total}</NumberCell>
                      <BodyCell textAlign="right">
                        <StatusBadge status={resource.status} />
                      </BodyCell>
                    </Box>
                  ))
                ) : (
                  <Box key={outlet.id} as="tr" borderBottomColor="gray.100" borderBottomWidth="1px">
                    <BodyCell>
                      <Text color="gray.900" fontWeight="800">{outlet.name}</Text>
                    </BodyCell>
                    <BodyCell>
                      <Text color="gray.500">No inventory rows</Text>
                    </BodyCell>
                    <td colSpan={5} />
                  </Box>
                )
              ))}
            </Box>
          </Box>
        </Box>
      </Card.Body>
    </Card.Root>
  )
}

function UsageBar({ totals }: { totals: ResourceTotals }) {
  const status = getStatus(totals)
  const availablePercent = getPercent(totals.available, totals.total)
  const deployedPercent = getPercent(totals.deployed, totals.total)

  return (
    <Stack gap="2">
      <Flex justify="space-between" gap="3">
        <Text color="gray.500" fontSize="xs" fontWeight="700">
          {availablePercent}% available
        </Text>
        <Text color="gray.500" fontSize="xs" fontWeight="700">
          {deployedPercent}% deployed
        </Text>
      </Flex>
      <Box bg="gray.100" h="2" overflow="hidden">
        <Box bg={progressColors[status]} h="100%" width={`${availablePercent}%`} />
      </Box>
    </Stack>
  )
}

function HeaderCell({
  children,
  textAlign = 'left',
  width,
}: {
  children: string
  textAlign?: 'left' | 'right'
  width?: string
}) {
  return (
    <Box as="th" color="gray.500" fontSize="xs" fontWeight="800" px="5" py="3" textAlign={textAlign} textTransform="uppercase" width={width}>
      {children}
    </Box>
  )
}

function BodyCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'right'
}) {
  return (
    <Box as="td" px="5" py="4" textAlign={textAlign} verticalAlign="middle">
      {children}
    </Box>
  )
}

function NumberCell({ children }: { children: number }) {
  return (
    <BodyCell textAlign="right">
      <Text color="gray.900" fontWeight="800">
        {children.toLocaleString()}
      </Text>
    </BodyCell>
  )
}

function FilterLabel({ children }: { children: string }) {
  return (
    <Text color="gray.500" fontSize="xs" fontWeight="800" mb="2" textTransform="uppercase">
      {children}
    </Text>
  )
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  const style = statusStyles[status]

  return (
    <Badge bg={style.bg} color={style.color}>
      {statusLabels[status]}
    </Badge>
  )
}

function getFilterOptions(outlets: ResourceOutlet[]) {
  return {
    agencies: unique(outlets.map((outlet) => outlet.agencyId)),
    categories: unique(outlets.flatMap((outlet) => outlet.resources.map((resource) => resource.category))),
    outletTypes: unique(outlets.map((outlet) => outlet.type)),
    regions: unique(outlets.map((outlet) => outlet.region).filter((value): value is string => Boolean(value))),
  }
}

function filterOutlets(
  outlets: ResourceOutlet[],
  search: string,
  status: StatusFilter,
) {
  const normalizedSearch = search.trim().toLowerCase()

  return outlets.filter((outlet) => {
    const matchesStatus = status === 'all' || outlet.status === status || outlet.resources.some((resource) => resource.status === status)
    const haystack = [
      outlet.agencyId,
      outlet.name,
      outlet.region,
      outlet.type,
      ...outlet.resources.flatMap((resource) => [
        resource.name,
        resource.category,
      ]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch))
  })
}

function unique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function getStatus(totals: ResourceTotals): ResourceStatus {
  if (totals.total <= 0) {
    return 'critical'
  }

  const ratio = totals.available / totals.total

  if (ratio < 0.15) {
    return 'critical'
  }

  if (ratio < 0.4) {
    return 'strained'
  }

  return 'healthy'
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function formatLabel(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
