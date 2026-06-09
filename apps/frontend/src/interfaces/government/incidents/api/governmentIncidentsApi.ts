import type { IncidentApiDto } from '../../../responder/incidents/api/incidentsDto'
import { getIncidentSeverity } from '../../../responder/incidents/utils/severity'
import type { GovernmentIncident, GovernmentIncidentStatus } from '../types/incident'

export async function fetchGovernmentIncidents() {
  const response = await fetch('/api/incidents')

  if (!response.ok) {
    throw new Error('Unable to load government incidents')
  }

  const incidents = (await response.json()) as IncidentApiDto[]
  return incidents.map(mapGovernmentIncidentFromApi)
}

function mapGovernmentIncidentFromApi(
  apiIncident: IncidentApiDto,
): GovernmentIncident {
  return {
    assignedOrgs: apiIncident.assignedOrgs,
    assignedResources: apiIncident.assignedResources ?? [],
    agencyProgress: apiIncident.agencyProgress ?? [],
    createdAt: formatIncidentDate(apiIncident.createdAt),
    description: apiIncident.description,
    id: apiIncident.id,
    incidentType: apiIncident.incidentType,
    location: apiIncident.location,
    severity: getIncidentSeverity(apiIncident.severity),
    status: getGovernmentIncidentStatus(apiIncident.status),
    title: apiIncident.title,
    volunteerCount: 0,
  }
}

function getGovernmentIncidentStatus(status: string): GovernmentIncidentStatus {
  const normalized = status.trim().toLowerCase()
  const knownStatuses = new Set<GovernmentIncidentStatus>([
    'reported',
    'triage',
    'responding',
    'on_scene',
    'stabilising',
    'monitoring',
    'resolved',
    'closed',
  ])

  if (normalized === 'active') {
    return 'responding'
  }

  return knownStatuses.has(normalized as GovernmentIncidentStatus)
    ? (normalized as GovernmentIncidentStatus)
    : 'reported'
}

function formatIncidentDate(date: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(date))
    .replace(/\b(am|pm)\b/i, (period) => period.toLowerCase())
}
