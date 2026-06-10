import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  Clock3,
  PieChart,
  Siren,
  Table2,
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

const chartColors = [
  '#2563eb',
  '#0891b2',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#65a30d',
  '#475569',
]

type DistributionView = 'bar' | 'doughnut'

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

          <ResolutionPerformance overview={overview} />

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
  const [view, setView] = useState<DistributionView>('bar')
  const maxCount = Math.max(...items.map((item) => item.count), 1)
  const hasData = items.some((item) => item.count > 0)

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="5">
      <Flex justify="space-between" align="center" gap="3" mb="4" wrap="wrap">
        <Heading size="md" color="gray.900">
          {title}
        </Heading>
        <ChartViewToggle view={view} onChange={setView} />
      </Flex>
      {!hasData ? (
        <Text color="gray.500">No data for this period.</Text>
      ) : view === 'doughnut' ? (
        <DoughnutChart items={items} />
      ) : (
        <Stack gap="4">
          {items.map((item, index) => (
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
                  bg={chartColors[index % chartColors.length]}
                  height="100%"
                  width={`${(item.count / maxCount) * 100}%`}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function ChartViewToggle({
  onChange,
  view,
}: {
  onChange: (view: DistributionView) => void
  view: DistributionView
}) {
  return (
    <HStack gap="1">
      <Button
        aria-label="Show bar chart"
        aria-pressed={view === 'bar'}
        bg={view === 'bar' ? 'blue.700' : 'white'}
        color={view === 'bar' ? 'white' : 'gray.600'}
        size="xs"
        variant={view === 'bar' ? 'solid' : 'outline'}
        onClick={() => onChange('bar')}
      >
        <BarChart3 size={14} />
        Bars
      </Button>
      <Button
        aria-label="Show doughnut chart"
        aria-pressed={view === 'doughnut'}
        bg={view === 'doughnut' ? 'blue.700' : 'white'}
        color={view === 'doughnut' ? 'white' : 'gray.600'}
        size="xs"
        variant={view === 'doughnut' ? 'solid' : 'outline'}
        onClick={() => onChange('doughnut')}
      >
        <PieChart size={14} />
        Doughnut
      </Button>
    </HStack>
  )
}

function DoughnutChart({ items }: { items: AnalyticsDistributionItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const hoveredItem =
    hoveredIndex === null ? null : items[hoveredIndex] ?? null

  return (
    <Flex
      align={{ base: 'stretch', sm: 'center' }}
      direction={{ base: 'column', sm: 'row' }}
      gap="6"
    >
      <Box position="relative" width="180px" height="180px" mx="auto">
        <svg
          aria-label={`${total} incidents shown in a doughnut chart`}
          role="img"
          viewBox="0 0 100 100"
          width="180"
          height="180"
        >
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke="#e2e8f0"
            strokeWidth="14"
          />
          {items.map((item, index) => {
            const segmentLength = (item.count / total) * circumference
            const segmentOffset =
              (items
                .slice(0, index)
                .reduce((sum, previousItem) => sum + previousItem.count, 0) /
                total) *
              circumference

            return (
              <circle
                key={item.key}
                aria-label={`${formatLabel(item.key)}: ${item.count} incidents`}
                cursor="pointer"
                cx="50"
                cy="50"
                fill="none"
                opacity={
                  hoveredIndex === null || hoveredIndex === index ? 1 : 0.45
                }
                r={radius}
                stroke={
                  hoveredIndex === null || hoveredIndex === index
                    ? chartColors[index % chartColors.length]
                    : '#cbd5e1'
                }
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-segmentOffset}
                strokeLinecap="butt"
                strokeWidth={hoveredIndex === index ? '16' : '14'}
                tabIndex={0}
                transform="rotate(-90 50 50)"
                onBlur={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>
                  {formatLabel(item.key)}: {item.count} (
                  {formatPercent(item.percentage)})
                </title>
              </circle>
            )
          })}
        </svg>

        {hoveredItem && (
          <Box
            position="absolute"
            top="-2"
            left="50%"
            transform="translate(-50%, -100%)"
            bg="gray.900"
            color="white"
            minW="36"
            px="3"
            py="2"
            pointerEvents="none"
            boxShadow="md"
            zIndex="1"
          >
            <Text fontSize="sm" fontWeight="800" lineClamp="1">
              {formatLabel(hoveredItem.key)}
            </Text>
            <Text color="gray.200" fontSize="xs">
              {hoveredItem.count} incident
              {hoveredItem.count === 1 ? '' : 's'} ·{' '}
              {formatPercent(hoveredItem.percentage)}
            </Text>
          </Box>
        )}

        <Flex
          position="absolute"
          inset="0"
          align="center"
          justify="center"
          direction="column"
          pointerEvents="none"
        >
          <Text color="gray.900" fontSize="2xl" fontWeight="800">
            {total}
          </Text>
          <Text color="gray.500" fontSize="xs">
            incidents
          </Text>
        </Flex>
      </Box>
      <Stack gap="2" flex="1">
        {items.map((item, index) => (
          <Flex
            key={item.key}
            justify="space-between"
            gap="3"
            opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.45}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <HStack gap="2">
              <Box
                bg={
                  hoveredIndex === null || hoveredIndex === index
                    ? chartColors[index % chartColors.length]
                    : 'gray.300'
                }
                width="3"
                height="3"
                flexShrink="0"
              />
              <Text color="gray.700" fontSize="sm" fontWeight="700">
                {formatLabel(item.key)}
              </Text>
            </HStack>
            <Text color="gray.500" fontSize="sm">
              {item.count} ({formatPercent(item.percentage)})
            </Text>
          </Flex>
        ))}
      </Stack>
    </Flex>
  )
}

function ResolutionPerformance({ overview }: { overview: AnalyticsOverview }) {
  const resolution = overview.data.totals.resolutionTimeMinutes
  const metrics = [
    { label: 'Average', value: resolution.average },
    { label: 'Median', value: resolution.median },
    { label: 'P90', value: resolution.p90 },
  ]
  const maxValue = Math.max(
    ...metrics.map((metric) => metric.value ?? 0),
    1,
  )

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="5">
      <Flex justify="space-between" align="start" gap="4" wrap="wrap" mb="5">
        <Box>
          <Heading size="md" color="gray.900">
            Resolution performance
          </Heading>
          <Text color="gray.500" fontSize="sm" mt="1">
            Time from incident creation to resolution for closed incidents.
          </Text>
        </Box>
        <LabelBox tone="green">Direct timestamps</LabelBox>
      </Flex>
      {metrics.every((metric) => metric.value === null) ? (
        <Text color="gray.500">
          No resolved incidents are available for this period.
        </Text>
      ) : (
        <Stack gap="4">
          {metrics.map((metric, index) => (
            <Box key={metric.label}>
              <Flex justify="space-between" gap="3" mb="1">
                <Text color="gray.700" fontWeight="700">
                  {metric.label}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  {formatMinutes(metric.value)}
                </Text>
              </Flex>
              <Box bg="gray.100" height="3">
                <Box
                  bg={chartColors[index]}
                  height="100%"
                  width={`${((metric.value ?? 0) / maxValue) * 100}%`}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function OrganisationPerformance({
  overview,
}: {
  overview: AnalyticsOverview
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
      <Flex
        p="5"
        borderBottomWidth="1px"
        borderColor="gray.100"
        justify="space-between"
        align="start"
        gap="4"
        wrap="wrap"
      >
        <Box>
          <Heading size="md" color="gray.900">
            Organisation performance
          </Heading>
          <Text color="gray.500" fontSize="sm" mt="1">
            Comparable workload metrics with log-derived response indicators.
          </Text>
        </Box>
        <HStack gap="1">
          <Button
            aria-pressed={view === 'chart'}
            bg={view === 'chart' ? 'blue.700' : 'white'}
            color={view === 'chart' ? 'white' : 'gray.600'}
            size="xs"
            variant={view === 'chart' ? 'solid' : 'outline'}
            onClick={() => setView('chart')}
          >
            <BarChart3 size={14} />
            Workload
          </Button>
          <Button
            aria-pressed={view === 'table'}
            bg={view === 'table' ? 'blue.700' : 'white'}
            color={view === 'table' ? 'white' : 'gray.600'}
            size="xs"
            variant={view === 'table' ? 'solid' : 'outline'}
            onClick={() => setView('table')}
          >
            <Table2 size={14} />
            Details
          </Button>
        </HStack>
      </Flex>
      {view === 'chart' ? (
        <OrganisationWorkloadChart organisations={overview.data.organisations} />
      ) : (
        <OrganisationPerformanceTable overview={overview} />
      )}
    </Box>
  )
}

function OrganisationWorkloadChart({
  organisations,
}: {
  organisations: AnalyticsOverview['data']['organisations']
}) {
  const maxValue = Math.max(
    ...organisations.flatMap((organisation) => [
      organisation.incidentsHandled,
      organisation.activeWorkload,
      organisation.completedAssignments,
    ]),
    1,
  )

  if (organisations.length === 0) {
    return (
      <Text color="gray.500" p="5">
        No assigned organisations in this period.
      </Text>
    )
  }

  return (
    <Box p="5" minW="640px">
      <HStack gap="4" mb="5" wrap="wrap">
        <ChartLegend color={chartColors[0]} label="Incidents handled" />
        <ChartLegend color={chartColors[1]} label="Active workload" />
        <ChartLegend color={chartColors[2]} label="Completed assignments" />
      </HStack>
      <Stack gap="5">
        {organisations.map((organisation) => (
          <Box key={organisation.organisationId}>
            <Flex justify="space-between" gap="3" mb="2">
              <Text color="gray.800" fontWeight="800">
                {organisation.organisationName}
              </Text>
              <Text color="gray.500" fontSize="sm">
                {formatPercent(organisation.completionRate)} completion
              </Text>
            </Flex>
            <Stack gap="1">
              {[
                organisation.incidentsHandled,
                organisation.activeWorkload,
                organisation.completedAssignments,
              ].map((value, index) => (
                <Flex key={index} align="center" gap="3">
                  <Box bg="gray.100" height="2" flex="1">
                    <Box
                      bg={chartColors[index]}
                      height="100%"
                      width={`${(value / maxValue) * 100}%`}
                    />
                  </Box>
                  <Text color="gray.600" fontSize="xs" width="6" textAlign="end">
                    {value}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <HStack gap="2">
      <Box bg={color} width="3" height="3" />
      <Text color="gray.600" fontSize="sm">
        {label}
      </Text>
    </HStack>
  )
}

function OrganisationPerformanceTable({
  overview,
}: {
  overview: AnalyticsOverview
}) {
  return (
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
              formatMinutes(organisation.averageFirstActiveResponseMinutes),
            ]}
          />
        ))
      )}
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
