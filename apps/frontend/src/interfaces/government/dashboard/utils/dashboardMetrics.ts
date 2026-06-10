import type { GovernmentAlert } from '../../alerts/types/alert'
import type { GovernmentDashboardData } from '../api/governmentDashboardApi'

export type DashboardSummaryMetric = {
  id: string
  label: string
  value: string
  detail: string
  helper: string
  tone: 'blue' | 'green' | 'orange' | 'red'
}

export type SeverityDistributionItem = {
  color: string
  count: number
  label: string
  widthPercent: number
}

const severityLabels: Record<number, { color: string; label: string }> = {
  5: { color: '#ef4444', label: 'Critical' },
  4: { color: '#f59e0b', label: 'High' },
  3: { color: '#22a77a', label: 'Medium' },
  2: { color: '#2563eb', label: 'Low' },
  1: { color: '#64748b', label: 'Minimal' },
}

export function getActiveDashboardAlerts(alerts: GovernmentAlert[]) {
  return alerts.filter((alert) => alert.status !== 'Normal')
}

export function getDashboardSummaryMetrics(
  data: GovernmentDashboardData,
): DashboardSummaryMetric[] {
  const totals = data.analytics.data.totals
  const resourceTotals = data.resources?.totals
  const resourceTotal = resourceTotals?.total ?? 0
  const resourceAvailable = resourceTotals?.available ?? 0
  const occupiedResources = Math.max(resourceTotal - resourceAvailable, 0)
  const occupancyRate = resourceTotal === 0 ? 0 : occupiedResources / resourceTotal
  const resolvedToday = countResolvedToday(data.incidents)
  const recentBroadcasts = countRecentBroadcasts(data.broadcasts)
  const activeAgencies = data.analytics.data.organisations.filter(
    (organisation) => organisation.activeWorkload > 0,
  )

  return [
    {
      id: 'total-incidents',
      label: 'Total Incidents',
      value: totals.totalIncidents.toString(),
      detail: `${totals.activeIncidents} active`,
      helper: `${totals.activeIncidents} open`,
      tone: 'orange',
    },
    {
      id: 'critical-cases',
      label: 'Critical Cases',
      value: totals.criticalIncidents.toString(),
      detail: 'severity level 5',
      helper: totals.criticalIncidents > 0 ? 'Needs attention' : 'No critical cases',
      tone: 'red',
    },
    {
      id: 'hospital-capacity',
      label: 'Hospital Capacity',
      value: resourceAvailable.toString(),
      detail: `${formatPercent(occupancyRate)} occupancy`,
      helper: `${resourceTotal} total resources`,
      tone: 'green',
    },
    {
      id: 'resolved-today',
      label: 'Resolved Today',
      value: resolvedToday.toString(),
      detail: `of ${totals.totalIncidents} total`,
      helper: `${formatPercent(rate(resolvedToday, Math.max(totals.totalIncidents, 1)))} resolution rate`,
      tone: 'green',
    },
    {
      id: 'avg-response-time',
      label: 'Avg Response Time',
      value: formatMinutes(totals.resolutionTimeMinutes.average),
      detail: 'vs 5min target',
      helper:
        (totals.resolutionTimeMinutes.average ?? 0) <= 5
          ? 'Within SLA'
          : 'Above target',
      tone: 'blue',
    },
    {
      id: 'available-volunteers',
      label: 'Available Volunteers',
      value: data.volunteerOpportunities.length.toString(),
      detail: 'open opportunities',
      helper: 'Ready to deploy',
      tone: 'green',
    },
    {
      id: 'recent-broadcasts',
      label: 'Recent Broadcasts',
      value: recentBroadcasts.toString(),
      detail: 'last 24 hours',
      helper: 'Public comms',
      tone: 'blue',
    },
    {
      id: 'agencies-active',
      label: 'Agencies Active',
      value: activeAgencies.length.toString(),
      detail: 'coordinating now',
      helper: activeAgencies
        .slice(0, 3)
        .map((agency) => agency.organisationName)
        .join(', ') || 'No active agencies',
      tone: 'blue',
    },
  ]
}

export function getIncidentsByType(data: GovernmentDashboardData) {
  return data.analytics.data.incidentsByType.slice(0, 6)
}

export function getSeverityDistribution(
  data: GovernmentDashboardData,
): SeverityDistributionItem[] {
  const entries = data.analytics.data.severityDistribution
    .filter((item) => item.count > 0)
    .map((item) => ({
      count: item.count,
      ...severityLabels[item.severity],
    }))
    .filter((item): item is { color: string; count: number; label: string } =>
      Boolean(item.label),
    )
  const maxCount = Math.max(...entries.map((item) => item.count), 1)

  return entries.map((item) => ({
    ...item,
    widthPercent: (item.count / maxCount) * 100,
  }))
}

export function formatAlertValue(value: number, unit: string) {
  return unit === 'percent' ? `${value}%` : value.toString()
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function countResolvedToday(incidents: GovernmentDashboardData['incidents']) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
  }).format(new Date())

  return incidents.filter((incident) => {
    if (!incident.resolvedAt) return false
    const resolvedDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
    }).format(new Date(incident.resolvedAt))
    return resolvedDay === today
  }).length
}

function countRecentBroadcasts(
  broadcasts: GovernmentDashboardData['broadcasts'],
) {
  const since = Date.now() - 24 * 60 * 60 * 1000

  return broadcasts.filter((broadcast) => {
    const timestamp = new Date(broadcast.publishedAt ?? broadcast.createdAt).getTime()
    return Number.isFinite(timestamp) && timestamp >= since
  }).length
}

function formatMinutes(value: number | null) {
  if (value === null) return 'N/A'
  if (value < 60) return `${Math.round(value)}m`
  return `${(value / 60).toFixed(1)}h`
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator
}
