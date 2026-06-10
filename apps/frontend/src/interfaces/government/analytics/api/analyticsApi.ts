export type AnalyticsOverviewFilters = {
  from: string
  to: string
  incidentType?: string
  severity?: string
  status?: string
  organisationId?: string
  region?: string
}

export type AnalyticsDistributionItem = {
  key: string
  count: number
  percentage: number
}

export type AnalyticsOverview = {
  filters: {
    from: string
    to: string
    incidentType: string | null
    severity: number | null
    status: string | null
    organisationId: string | null
    region: string | null
  }
  generatedAt: string
  data: {
    totals: {
      totalIncidents: number
      activeIncidents: number
      closedIncidents: number
      criticalIncidents: number
      criticalIncidentRate: number
      averageSeverity: number | null
      multiAgencyRate: number
      resolutionTimeMinutes: {
        average: number | null
        median: number | null
        p90: number | null
        quality: 'direct'
      }
    }
    incidentsByType: AnalyticsDistributionItem[]
    incidentsByRegion: Array<{
      region: string
      count: number
    }>
    severityDistribution: Array<{
      severity: number
      count: number
    }>
    statusDistribution: AnalyticsDistributionItem[]
    organisations: Array<{
      organisationId: string
      organisationName: string
      incidentsHandled: number
      activeWorkload: number
      completedAssignments: number
      completionRate: number
      averageFirstUpdateMinutes: number | null
      averageFirstActiveResponseMinutes: number | null
      timingQuality: 'inferred'
    }>
  }
  dataQuality: {
    unknownRegions: number
    invalidDurations: number
    inferredMetrics: string[]
  }
}

export type AnalyticsForecast = {
  filters: AnalyticsOverview['filters']
  generatedAt: string
  forecast: {
    horizonDays: number
    periodStart: string
    periodEnd: string
    expectedIncidents: number
    likelyRange: {
      low: number
      high: number
    }
    confidence: 'very_low' | 'low' | 'medium' | 'high'
    sampleSize: number
    historyDays: number
    topIncidentType: string | null
    topRegion: string | null
    dailySeries: Array<{
      date: string
      observed: number | null
      expected: number | null
      low: number | null
      high: number | null
      kind: 'observed' | 'forecast'
    }>
    byType: AnalyticsForecastDistributionItem[]
    byRegion: AnalyticsForecastDistributionItem[]
  }
  methodology: {
    model: 'recency_weighted_rate'
    recencyHalfLifeDays: number
    interval: 'approximate_95_percent_poisson'
    dataSource: 'simulated_incidents'
    limitations: string[]
  }
}

export type AnalyticsForecastDistributionItem = {
  key: string
  expectedCount: number
  share: number
}

export async function fetchAnalyticsOverview(
  filters: AnalyticsOverviewFilters,
) {
  const searchParams = getAnalyticsSearchParams(filters)
  const response = await fetch(`/api/analytics/overview?${searchParams}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as AnalyticsOverview
}

export async function fetchAnalyticsForecast(
  filters: AnalyticsOverviewFilters,
  days = 7,
) {
  const searchParams = getAnalyticsSearchParams(filters)
  searchParams.set('days', String(days))
  const response = await fetch(`/api/analytics/forecast?${searchParams}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return (await response.json()) as AnalyticsForecast
}

function getAnalyticsSearchParams(filters: AnalyticsOverviewFilters) {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  return searchParams
}

async function getErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[]
  } | null
  const message = Array.isArray(body?.message)
    ? body.message.join(' ')
    : body?.message

  return message ?? 'Unable to load government analytics'
}
