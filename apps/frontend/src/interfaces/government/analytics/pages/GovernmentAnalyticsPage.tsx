import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import {
  Activity,
  Building2,
  Clock3,
  Siren,
  TriangleAlert,
} from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import {
  fetchAnalyticsOverview,
  type AnalyticsDistributionItem,
  type AnalyticsOverview,
  type AnalyticsOverviewFilters,
} from '../api/analyticsApi'

const regions = [
  'Central',
  'East',
  'West',
  'North',
  'North-East',
  'Unknown',
]

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function initialFilters(): AnalyticsOverviewFilters {
  const to = new Date()
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    from: dateInputValue(from),
    to: dateInputValue(to),
  }
}

export function GovernmentAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsOverviewFilters>(
    initialFilters,
  )
  const [appliedFilters, setAppliedFilters] =
    useState<AnalyticsOverviewFilters>(filters)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadOverview() {
      try {
        setIsLoading(true)
        setError(null)
        const nextOverview = await fetchAnalyticsOverview({
          ...appliedFilters,
          from: `${appliedFilters.from}T00:00:00.000+08:00`,
          to: `${appliedFilters.to}T23:59:59.999+08:00`,
        })

        if (isCurrent) {
          setOverview(nextOverview)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load government analytics',
          )
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadOverview()

    return () => {
      isCurrent = false
    }
  }, [appliedFilters])

  const organisationOptions = useMemo(
    () => overview?.data.organisations ?? [],
    [overview],
  )

  return (
    <Stack gap="5">
      <Box>
        <Heading size="3xl" color="gray.900">
          National Analytics
        </Heading>
        <Text color="gray.500" mt="1">
          Incident performance, multi-agency workload and response indicators.
        </Text>
      </Box>

      <FilterPanel
        filters={filters}
        organisations={organisationOptions}
        onChange={setFilters}
        onApply={() => setAppliedFilters(filters)}
      />

      {isLoading ? (
        <DashboardNotice text="Loading analytics..." />
      ) : error ? (
        <DashboardNotice text={error} tone="error" />
      ) : !overview ? (
        <DashboardNotice text="No analytics response was returned." />
      ) : (
        <>
          <Box
            display="grid"
            gridTemplateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              xl: 'repeat(5, 1fr)',
            }}
            gap="3"
          >
            <MetricCard
              icon={Siren}
              label="Total incidents"
              value={overview.data.totals.totalIncidents}
              detail={`${overview.data.totals.activeIncidents} currently active`}
            />
            <MetricCard
              icon={TriangleAlert}
              label="Critical incidents"
              value={overview.data.totals.criticalIncidents}
              detail={formatPercent(
                overview.data.totals.criticalIncidentRate,
              )}
            />
            <MetricCard
              icon={Building2}
              label="Multi-agency rate"
              value={formatPercent(overview.data.totals.multiAgencyRate)}
              detail="Incidents with multiple assigned organisations"
            />
            <MetricCard
              icon={Activity}
              label="Average severity"
              value={formatNumber(overview.data.totals.averageSeverity)}
              detail="Scale of 1 to 5"
            />
            <MetricCard
              icon={Clock3}
              label="Median resolution"
              value={formatMinutes(
                overview.data.totals.resolutionTimeMinutes.median,
              )}
              detail="Direct incident timestamps"
            />
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }}
            gap="4"
          >
            <DistributionPanel
              title="Incidents by type"
              items={overview.data.incidentsByType}
            />
            <DistributionPanel
              title="Lifecycle status"
              items={overview.data.statusDistribution}
            />
            <DistributionPanel
              title="Incidents by region"
              items={overview.data.incidentsByRegion.map((item) => ({
                key: item.region,
                count: item.count,
                percentage: rate(
                  item.count,
                  overview.data.totals.totalIncidents,
                ),
              }))}
            />
            <DistributionPanel
              title="Severity distribution"
              items={overview.data.severityDistribution.map((item) => ({
                key: `Severity ${item.severity}`,
                count: item.count,
                percentage: rate(
                  item.count,
                  overview.data.totals.totalIncidents,
                ),
              }))}
            />
          </Box>

          <OrganisationPerformance overview={overview} />

          <Flex justify="space-between" gap="4" wrap="wrap">
            <Text color="gray.500" fontSize="sm">
              Generated {formatDateTime(overview.generatedAt)}
            </Text>
            <HStack gap="2" wrap="wrap">
              <LabelBox tone="gray">
                {overview.dataQuality.unknownRegions} unknown regions
              </LabelBox>
              <LabelBox tone="yellow">
                Agency response timing is inferred from logs
              </LabelBox>
            </HStack>
          </Flex>
        </>
      )}
    </Stack>
  )
}

function FilterPanel({
  filters,
  organisations,
  onChange,
  onApply,
}: {
  filters: AnalyticsOverviewFilters
  organisations: AnalyticsOverview['data']['organisations']
  onChange: (filters: AnalyticsOverviewFilters) => void
  onApply: () => void
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <Box
        display="grid"
        gridTemplateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          xl: 'repeat(5, 1fr)',
        }}
        gap="3"
      >
        <FilterField label="From">
          <Input
            type="date"
            value={filters.from}
            onChange={(event) =>
              onChange({ ...filters, from: event.currentTarget.value })
            }
          />
        </FilterField>
        <FilterField label="To">
          <Input
            type="date"
            value={filters.to}
            onChange={(event) =>
              onChange({ ...filters, to: event.currentTarget.value })
            }
          />
        </FilterField>
        <FilterField label="Region">
          <Select
            value={filters.region ?? ''}
            onChange={(event) =>
              onChange({ ...filters, region: event.currentTarget.value })
            }
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Severity">
          <Select
            value={filters.severity ?? ''}
            onChange={(event) =>
              onChange({ ...filters, severity: event.currentTarget.value })
            }
          >
            <option value="">All severities</option>
            {[1, 2, 3, 4, 5].map((severity) => (
              <option key={severity} value={severity}>
                Severity {severity}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Organisation">
          <Select
            value={filters.organisationId ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                organisationId: event.currentTarget.value,
              })
            }
          >
            <option value="">All organisations</option>
            {organisations.map((organisation) => (
              <option
                key={organisation.organisationId}
                value={organisation.organisationId}
              >
                {organisation.organisationName}
              </option>
            ))}
          </Select>
        </FilterField>
      </Box>
      <Flex justify="flex-end" mt="4">
        <Button
          bg="blue.700"
          color="white"
          onClick={onApply}
          _hover={{ bg: 'blue.800' }}
        >
          Apply filters
        </Button>
      </Flex>
    </Box>
  )
}

function FilterField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <Stack gap="1">
      <Text
        color="gray.500"
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </Text>
      {children}
    </Stack>
  )
}

function MetricCard({
  detail,
  icon: IconComponent,
  label,
  value,
}: {
  detail: string
  icon: ElementType
  label: string
  value: number | string
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <Flex justify="space-between" align="start" gap="3">
        <Box>
          <Text
            color="gray.500"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
          >
            {label}
          </Text>
          <Text color="gray.900" fontSize="3xl" fontWeight="800" mt="2">
            {value}
          </Text>
        </Box>
        <Box color="blue.600">
          <IconComponent size={22} />
        </Box>
      </Flex>
      <Text color="gray.500" fontSize="sm" mt="2">
        {detail}
      </Text>
    </Box>
  )
}

function DistributionPanel({
  items,
  title,
}: {
  items: AnalyticsDistributionItem[]
  title: string
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1)

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="5">
      <Heading size="md" color="gray.900" mb="4">
        {title}
      </Heading>
      <Stack gap="4">
        {items.length === 0 ? (
          <Text color="gray.500">No data for this period.</Text>
        ) : (
          items.map((item) => (
            <Box key={item.key}>
              <Flex justify="space-between" gap="3" mb="1">
                <Text color="gray.700" fontWeight="700">
                  {formatLabel(item.key)}
                </Text>
                <Text color="gray.500" fontSize="sm">
                  {item.count} ({formatPercent(item.percentage)})
                </Text>
              </Flex>
              <Box bg="gray.100" height="2">
                <Box
                  bg="blue.600"
                  height="100%"
                  width={`${(item.count / maxCount) * 100}%`}
                />
              </Box>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  )
}

function OrganisationPerformance({
  overview,
}: {
  overview: AnalyticsOverview
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
      <Box p="5" borderBottomWidth="1px" borderColor="gray.100">
        <Heading size="md" color="gray.900">
          Organisation performance
        </Heading>
        <Text color="gray.500" fontSize="sm" mt="1">
          Comparable workload metrics with log-derived response indicators.
        </Text>
      </Box>
      <Box minW="900px">
        <PerformanceRow
          values={[
            'Organisation',
            'Handled',
            'Active',
            'Completed',
            'Completion',
            'First update',
            'Active response',
          ]}
          isHeader
        />
        {overview.data.organisations.length === 0 ? (
          <Text color="gray.500" p="5">
            No assigned organisations in this period.
          </Text>
        ) : (
          overview.data.organisations.map((organisation) => (
            <PerformanceRow
              key={organisation.organisationId}
              values={[
                organisation.organisationName,
                organisation.incidentsHandled,
                organisation.activeWorkload,
                organisation.completedAssignments,
                formatPercent(organisation.completionRate),
                formatMinutes(organisation.averageFirstUpdateMinutes),
                formatMinutes(
                  organisation.averageFirstActiveResponseMinutes,
                ),
              ]}
            />
          ))
        )}
      </Box>
    </Box>
  )
}

function PerformanceRow({
  isHeader = false,
  values,
}: {
  isHeader?: boolean
  values: Array<number | string>
}) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="1.5fr repeat(6, minmax(100px, 1fr))"
      borderBottomWidth="1px"
      borderColor="gray.100"
    >
      {values.map((value, index) => (
        <Text
          key={`${value}:${index}`}
          color={isHeader ? 'gray.500' : 'gray.800'}
          fontSize={isHeader ? 'xs' : 'sm'}
          fontWeight={isHeader || index === 0 ? '700' : '500'}
          px="4"
          py="3"
          textTransform={isHeader ? 'uppercase' : undefined}
        >
          {value}
        </Text>
      ))}
    </Box>
  )
}

function DashboardNotice({
  text,
  tone = 'default',
}: {
  text: string
  tone?: 'default' | 'error'
}) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor={tone === 'error' ? 'red.200' : 'gray.200'}
      p="6"
    >
      <Text color={tone === 'error' ? 'red.600' : 'gray.500'}>{text}</Text>
    </Box>
  )
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator
}

function formatNumber(value: number | null) {
  return value === null ? 'N/A' : value.toFixed(1)
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatMinutes(value: number | null) {
  if (value === null) return 'N/A'
  if (value < 60) return `${Math.round(value)} min`
  return `${(value / 60).toFixed(1)} hr`
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
