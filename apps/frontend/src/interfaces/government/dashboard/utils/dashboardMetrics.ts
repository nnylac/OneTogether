import type { GovernmentAlert } from '../../alerts/types/alert'
import type {
  DashboardResourceOutletDto,
  DashboardResourceTotalsDto,
  GovernmentDashboardData,
} from '../api/governmentDashboardApi'

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

export type DashboardDistributionItem = {
  count: number
  key: string
  percentage: number
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
  const totalIncidents = data.incidents.length
  const activeIncidents = data.incidents.filter(isActiveIncident).length
  const criticalIncidents = data.incidents.filter(
    (incident) => incident.severity === 5,
  ).length
  const hospitalCapacity = getHospitalCapacity(data.resourceOutlets)
  const resourceCapacity = getResourceCapacity(data.resources?.totals)
  const capacity = hospitalCapacity ?? resourceCapacity
  const resolvedToday = countResolvedToday(data.incidents)
  const recentBroadcasts = countRecentBroadcasts(data.broadcasts)
  const volunteerCapacity = getVolunteerCapacity(data.volunteerOpportunities)
  const activeAgencies = data.analytics.data.organisations.filter(
    (organisation) => organisation.activeWorkload > 0,
  )
  const averageResponseMinutes = getAverageResponseMinutes(data)

  return [
    {
      id: 'total-incidents',
      label: 'Total Incidents',
      value: totalIncidents.toString(),
      detail: `${activeIncidents} active`,
      helper: `${activeIncidents} open`,
      tone: 'orange',
    },
    {
      id: 'critical-cases',
      label: 'Critical Cases',
      value: criticalIncidents.toString(),
      detail: 'severity level 5',
      helper: criticalIncidents > 0 ? 'Needs attention' : 'No critical cases',
      tone: 'red',
    },
    {
      id: 'hospital-capacity',
      label: capacity.label,
      value: capacity.available.toString(),
      detail: `${formatPercent(capacity.occupancyRate)} occupancy`,
      helper: `${capacity.total} total ${capacity.unit}`,
      tone: 'green',
    },
    {
      id: 'resolved-today',
      label: 'Resolved Today',
      value: resolvedToday.toString(),
      detail: `of ${totalIncidents} total`,
      helper: `${formatPercent(rate(resolvedToday, totalIncidents))} resolution rate`,
      tone: 'green',
    },
    {
      id: 'avg-response-time',
      label: 'Avg Response Time',
      value: formatMinutes(averageResponseMinutes),
      detail: 'vs 5min target',
      helper:
        averageResponseMinutes !== null && averageResponseMinutes <= 5
          ? 'Within SLA'
          : averageResponseMinutes === null
            ? 'No response data'
            : 'Above target',
      tone: 'blue',
    },
    {
      id: 'available-volunteers',
      label: 'Available Volunteers',
      value: volunteerCapacity.available.toString(),
      detail: `${data.volunteerOpportunities.length} open opportunities`,
      helper: volunteerCapacity.hasSlotData
        ? `${volunteerCapacity.total} total slots`
        : 'Slot totals unavailable',
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
  return groupIncidentDistribution(
    data.incidents,
    (incident) => incident.incidentType || 'Unknown',
  ).slice(0, 6)
}

export function getSeverityDistribution(
  data: GovernmentDashboardData,
): SeverityDistributionItem[] {
  const entries = [1, 2, 3, 4, 5]
    .map((severity) => ({
      severity,
      count: data.incidents.filter((incident) => incident.severity === severity)
        .length,
    }))
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

function getHospitalCapacity(resourceOutlets: DashboardResourceOutletDto[]) {
  const hospitalOutlets = resourceOutlets.filter(isHospitalOutlet)
  const bedTotals = hospitalOutlets.reduce(
    (totals, outlet) => {
      const bedResource = outlet.resources.find((resource) => {
        const haystack = `${resource.name} ${resource.category}`.toLowerCase()
        return haystack.includes('bed') || haystack.includes('ward')
      })

      return {
        available: totals.available + (bedResource?.available ?? outlet.totals.available),
        total: totals.total + (bedResource?.total ?? outlet.totals.total),
      }
    },
    { available: 0, total: 0 },
  )

  if (bedTotals.total === 0) {
    return null
  }

  return {
    available: bedTotals.available,
    label: 'Hospital Capacity',
    occupancyRate: rate(bedTotals.total - bedTotals.available, bedTotals.total),
    total: bedTotals.total,
    unit: 'beds',
  }
}

function getResourceCapacity(totals: DashboardResourceTotalsDto | undefined) {
  const total = totals?.total ?? 0
  const available = totals?.available ?? 0

  return {
    available,
    label: 'Resource Capacity',
    occupancyRate: rate(total - available, total),
    total,
    unit: 'resources',
  }
}

function getVolunteerCapacity(
  opportunities: GovernmentDashboardData['volunteerOpportunities'],
) {
  const opportunitiesWithSlots = opportunities.filter(
    (opportunity) => opportunity.slotsLeft !== null,
  )

  if (opportunitiesWithSlots.length === 0) {
    return {
      available: opportunities.length,
      hasSlotData: false,
      total: opportunities.length,
    }
  }

  return {
    available: opportunitiesWithSlots.reduce(
      (total, opportunity) => total + (opportunity.slotsLeft ?? 0),
      0,
    ),
    hasSlotData: true,
    total: opportunitiesWithSlots.reduce(
      (total, opportunity) => total + (opportunity.slotsTotal ?? 0),
      0,
    ),
  }
}

function getAverageResponseMinutes(data: GovernmentDashboardData) {
  const responseDurations = data.analytics.data.organisations
    .map((organisation) => organisation.averageFirstActiveResponseMinutes)
    .filter((value): value is number => value !== null)

  if (responseDurations.length > 0) {
    return average(responseDurations)
  }

  return data.analytics.data.totals.resolutionTimeMinutes.average
}

function groupIncidentDistribution(
  incidents: GovernmentDashboardData['incidents'],
  getKey: (incident: GovernmentDashboardData['incidents'][number]) => string,
): DashboardDistributionItem[] {
  const counts = new Map<string, number>()

  incidents.forEach((incident) => {
    const key = getKey(incident)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([key, count]) => ({
      count,
      key,
      percentage: rate(count, incidents.length),
    }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
}

function isHospitalOutlet(outlet: DashboardResourceOutletDto) {
  const haystack = [
    outlet.name,
    outlet.type,
    outlet.agencyId,
    outlet.sourceSystemId,
    ...outlet.resources.map((resource) => resource.category),
    ...outlet.resources.map((resource) => resource.name),
  ]
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('hospital') ||
    haystack.includes('healthcare') ||
    haystack.includes('medical') ||
    haystack.includes('moh') ||
    haystack.includes('sgh')
  )
}

function isActiveIncident(incident: GovernmentDashboardData['incidents'][number]) {
  const status = incident.status.trim().toUpperCase()
  return status !== 'RESOLVED' && status !== 'CLOSED'
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

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}
