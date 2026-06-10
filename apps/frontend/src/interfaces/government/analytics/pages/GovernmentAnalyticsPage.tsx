import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  Clock3,
  PieChart,
  Siren,
  TrendingUp,
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
  fetchAnalyticsForecast,
  fetchAnalyticsOverview,
  type AnalyticsDistributionItem,
  type AnalyticsForecast,
  type AnalyticsForecastDistributionItem,
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
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
  }).format(date)
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
  const [forecast, setForecast] = useState<AnalyticsForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadOverview() {
      try {
        setIsLoading(true)
        setError(null)
        const requestFilters = {
          ...appliedFilters,
          from: `${appliedFilters.from}T00:00:00.000+08:00`,
          to: `${appliedFilters.to}T23:59:59.999+08:00`,
        }
        const [nextOverview, nextForecast] = await Promise.all([
          fetchAnalyticsOverview(requestFilters),
          fetchAnalyticsForecast(requestFilters),
        ])

        if (isCurrent) {
          setOverview(nextOverview)
          setForecast(nextForecast)
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

          {forecast ? (
            <SimulationForecast forecast={forecast} />
          ) : (
            <DashboardNotice text="No simulation forecast was returned." />
          )}

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

function SimulationForecast({ forecast }: { forecast: AnalyticsForecast }) {
  const data = forecast.forecast
  const hasEnoughData = data.sampleSize >= 10 && data.historyDays >= 7
  const confidenceTone =
    data.confidence === 'high'
      ? 'green'
      : data.confidence === 'medium'
        ? 'blue'
        : 'yellow'

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="blue.200"
      overflow="hidden"
    >
      <Flex
        bg="blue.50"
        p="5"
        justify="space-between"
        align="start"
        gap="4"
        wrap="wrap"
      >
        <Box>
          <HStack gap="2">
            <Box color="blue.700">
              <TrendingUp size={22} />
            </Box>
            <Heading size="md" color="gray.900">
              Simulation Forecast
            </Heading>
          </HStack>
          <Text color="gray.600" fontSize="sm" mt="2">
            Automatically projects scenario-engine incidents from the selected
            history window.
          </Text>
        </Box>
        <LabelBox tone={confidenceTone}>
          {formatLabel(data.confidence)} confidence
        </LabelBox>
      </Flex>

      <Box p="5">
        <Box
          display="grid"
          gridTemplateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(4, 1fr)',
          }}
          gap="3"
        >
          <ForecastMetric
            label={`Expected next ${data.horizonDays} days`}
            value={formatForecastCount(data.expectedIncidents)}
            detail={`${formatShortDate(data.periodStart)} to ${formatShortDate(data.periodEnd)}`}
          />
          <ForecastMetric
            label="Likely range"
            value={`${data.likelyRange.low}-${data.likelyRange.high}`}
            detail="Approximate 95% statistical range"
          />
          <ForecastMetric
            label="Most likely type"
            value={
              data.topIncidentType
                ? formatLabel(data.topIncidentType)
                : 'Not available'
            }
            detail="Based on recency-weighted history"
          />
          <ForecastMetric
            label="Highest projected region"
            value={data.topRegion ?? 'Not available'}
            detail={`${data.sampleSize} incidents across ${data.historyDays} days`}
          />
        </Box>

        {!hasEnoughData ? (
          <Box
            bg="red.50"
            borderWidth="1px"
            borderColor="red.200"
            p="4"
            mt="5"
          >
            <Text color="red.700" fontWeight="800">
              Not enough data to show a reliable forecast
            </Text>
            <Text color="red.600" fontSize="sm" mt="1">
              At least 10 incidents across 7 days are required. The selected
              period currently contains {data.sampleSize} incidents across{' '}
              {data.historyDays} days.
            </Text>
          </Box>
        ) : (
          <>
            <Box mt="6">
              <ForecastTimeSeries items={data.dailySeries} />
            </Box>
            <Box
              display="grid"
              gridTemplateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }}
              gap="5"
              mt="6"
            >
              <ForecastDistribution
                title="Projected mix by type"
                items={data.byType}
              />
              <ForecastDistribution
                title="Projected mix by region"
                items={data.byRegion}
              />
            </Box>
          </>
        )}

        <Text color="gray.500" fontSize="xs" mt="5">
          Experimental projection of simulator behavior, not real-world
          emergency risk. It updates automatically as incidents accumulate.
        </Text>
      </Box>
    </Box>
  )
}

function ForecastTimeSeries({
  items,
}: {
  items: AnalyticsForecast['forecast']['dailySeries']
}) {
  const width = Math.max(1100, items.length * 72)
  const height = 320
  const padding = { top: 30, right: 48, bottom: 56, left: 44 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(
    ...items.flatMap((item) => [
      item.observed ?? 0,
      item.expected ?? 0,
      item.high ?? 0,
    ]),
    1,
  )
  const points = items.map((item, index) => ({
    ...item,
    x:
      padding.left +
      (items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth),
    observedY:
      item.observed === null
        ? null
        : padding.top +
          chartHeight -
          (item.observed / maxValue) * chartHeight,
    expectedY:
      item.expected === null
        ? null
        : padding.top +
          chartHeight -
          (item.expected / maxValue) * chartHeight,
    lowY:
      item.low === null
        ? null
        : padding.top + chartHeight - (item.low / maxValue) * chartHeight,
    highY:
      item.high === null
        ? null
        : padding.top + chartHeight - (item.high / maxValue) * chartHeight,
  }))
  const observedPoints = points.filter(
    (point): point is typeof point & { observedY: number } =>
      point.observedY !== null,
  )
  const forecastPoints = points.filter(
    (point): point is typeof point & {
      expectedY: number
      lowY: number
      highY: number
    } =>
      point.expectedY !== null && point.lowY !== null && point.highY !== null,
  )
  const lastObserved = observedPoints.at(-1)
  const forecastLinePoints = [
    ...(lastObserved
      ? [{ x: lastObserved.x, expectedY: lastObserved.observedY }]
      : []),
    ...forecastPoints,
  ]
  const uncertaintyPoints = [
    ...forecastPoints.map((point) => `${point.x},${point.highY}`),
    ...[...forecastPoints]
      .reverse()
      .map((point) => `${point.x},${point.lowY}`),
  ].join(' ')

  return (
    <Box>
      <Flex justify="space-between" align="center" gap="3" wrap="wrap" mb="3">
        <Box>
          <Text color="gray.800" fontWeight="800">
            Incident volume over time
          </Text>
          <Text color="gray.500" fontSize="sm">
            Observed daily incidents followed by the next seven projected days.
          </Text>
        </Box>
        <HStack gap="4" wrap="wrap">
          <ChartLegend color="#475569" label="Observed" />
          <ChartLegend color="#2563eb" label="Projected" />
          <ChartLegend color="#bfdbfe" label="Likely range" />
        </HStack>
      </Flex>
      <Box overflowX="auto">
        <svg
          aria-label="Observed and projected incidents over time"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="320"
          style={{ minWidth: `${width}px` }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  textAnchor="end"
                >
                  {formatForecastCount(maxValue * (1 - ratio))}
                </text>
              </g>
            )
          })}
          {uncertaintyPoints ? (
            <polygon
              fill="#dbeafe"
              opacity="0.75"
              points={uncertaintyPoints}
            />
          ) : null}
          <polyline
            fill="none"
            points={observedPoints
              .map((point) => `${point.x},${point.observedY}`)
              .join(' ')}
            stroke="#475569"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <polyline
            fill="none"
            points={forecastLinePoints
              .map((point) => `${point.x},${point.expectedY}`)
              .join(' ')}
            stroke="#2563eb"
            strokeDasharray="8 5"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {points.map((point, index) => {
            const y = point.observedY ?? point.expectedY
            if (y === null) return null
            return (
              <g key={`${point.date}:${point.kind}`}>
                <circle
                  cx={point.x}
                  cy={y}
                  fill={point.kind === 'observed' ? '#475569' : '#2563eb'}
                  r="4"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>
                    {formatTimelineDate(point.date)}:{' '}
                    {point.kind === 'observed'
                      ? `${point.observed} observed`
                      : `${formatForecastCount(point.expected ?? 0)} projected (${point.low}-${point.high})`}
                  </title>
                </circle>
                {index % 2 === 0 || point.kind === 'forecast' ? (
                  <text
                    x={point.x}
                    y={height - 24}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatTimelineDate(point.date)}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </Box>
    </Box>
  )
}

function ForecastMetric({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" p="4">
      <Text
        color="gray.500"
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text color="gray.900" fontSize="2xl" fontWeight="800" mt="2">
        {value}
      </Text>
      <Text color="gray.500" fontSize="xs" mt="2">
        {detail}
      </Text>
    </Box>
  )
}

function ForecastDistribution({
  items,
  title,
}: {
  items: AnalyticsForecastDistributionItem[]
  title: string
}) {
  const visibleItems = items.slice(0, 6)
  const maxExpected = Math.max(
    ...visibleItems.map((item) => item.expectedCount),
    1,
  )

  return (
    <Box minW="0">
      <Text color="gray.800" fontWeight="800" mb="3">
        {title}
      </Text>
      <Stack gap="3">
        {visibleItems.map((item, index) => (
          <Box key={item.key}>
            <Flex justify="space-between" gap="3" mb="1">
              <Text color="gray.700" fontSize="sm" fontWeight="700">
                {formatLabel(item.key)}
              </Text>
              <Text color="gray.500" fontSize="sm">
                {formatForecastCount(item.expectedCount)} (
                {formatPercent(item.share)})
              </Text>
            </Flex>
            <Box bg="gray.100" height="2">
              <Box
                bg={chartColors[index % chartColors.length]}
                height="100%"
                width={`${(item.expectedCount / maxExpected) * 100}%`}
              />
            </Box>
          </Box>
        ))}
      </Stack>
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
  const [view, setView] = useState<DistributionView>('doughnut')
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
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius

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
                cx="50"
                cy="50"
                fill="none"
                r={radius}
                stroke={chartColors[index % chartColors.length]}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-segmentOffset}
                strokeWidth="14"
                transform="rotate(-90 50 50)"
              >
                <title>
                  {formatLabel(item.key)}: {item.count} (
                  {formatPercent(item.percentage)})
                </title>
              </circle>
            )
          })}
        </svg>
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
          <Flex key={item.key} justify="space-between" gap="3">
            <HStack gap="2">
              <Box
                bg={chartColors[index % chartColors.length]}
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
      </Flex>
      <OrganisationPerformanceTable overview={overview} />
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatForecastCount(value: number) {
  return value.toFixed(value < 10 && !Number.isInteger(value) ? 1 : 0)
}

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Singapore',
  }).format(new Date(`${value}T00:00:00+08:00`))
}
