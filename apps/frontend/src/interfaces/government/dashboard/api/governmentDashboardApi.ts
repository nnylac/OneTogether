import { fetchGovernmentAlertRules } from '../../alerts/api/governmentAlertRulesApi'
import type { GovernmentAlert } from '../../alerts/types/alert'
import {
  fetchAnalyticsOverview,
  type AnalyticsOverview,
  type AnalyticsOverviewFilters,
} from '../../analytics/api/analyticsApi'
import type { IncidentApiDto } from '../../../responder/incidents/api/incidentsDto'

export type DashboardBroadcastDto = {
  id: string
  createdAt: string
  publishedAt: string | null
  status: string
}

export type DashboardVolunteerOpportunityDto = {
  id: string
  status: string
}

export type DashboardResourceSummaryDto = {
  totals: {
    total: number
    available: number
    deployed: number
    reserved: number
    maintenance: number
  }
}

export type GovernmentDashboardData = {
  alerts: GovernmentAlert[]
  analytics: AnalyticsOverview
  broadcasts: DashboardBroadcastDto[]
  generatedAt: string
  incidents: IncidentApiDto[]
  resources: DashboardResourceSummaryDto | null
  volunteerOpportunities: DashboardVolunteerOpportunityDto[]
}

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function defaultAnalyticsFilters(): AnalyticsOverviewFilters {
  const to = new Date()
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    from: `${dateInputValue(from)}T00:00:00.000+08:00`,
    to: `${dateInputValue(to)}T23:59:59.999+08:00`,
  }
}

export async function fetchGovernmentDashboardData() {
  const [
    alerts,
    analytics,
    broadcasts,
    incidents,
    resources,
    volunteerOpportunities,
  ] = await Promise.all([
    fetchGovernmentAlertRules(),
    fetchAnalyticsOverview(defaultAnalyticsFilters()),
    fetchBroadcasts(),
    fetchIncidents(),
    fetchResourceSummary().catch(() => null),
    fetchVolunteerOpportunities().catch(() => []),
  ])

  return {
    alerts,
    analytics,
    broadcasts,
    generatedAt: new Date().toISOString(),
    incidents,
    resources,
    volunteerOpportunities,
  } satisfies GovernmentDashboardData
}

async function fetchIncidents() {
  const response = await fetch('/api/incidents')

  if (!response.ok) {
    throw new Error('Unable to load incidents')
  }

  return (await response.json()) as IncidentApiDto[]
}

async function fetchBroadcasts() {
  const response = await fetch('/api/broadcasts?status=published')

  if (!response.ok) {
    throw new Error('Unable to load broadcasts')
  }

  return (await response.json()) as DashboardBroadcastDto[]
}

async function fetchResourceSummary() {
  const response = await fetch('/api/resources/summary')

  if (!response.ok) {
    throw new Error('Unable to load resource summary')
  }

  return (await response.json()) as DashboardResourceSummaryDto
}

async function fetchVolunteerOpportunities() {
  const response = await fetch('/api/volunteer/opportunities?status=open')

  if (!response.ok) {
    throw new Error('Unable to load volunteer opportunities')
  }

  return (await response.json()) as DashboardVolunteerOpportunityDto[]
}

