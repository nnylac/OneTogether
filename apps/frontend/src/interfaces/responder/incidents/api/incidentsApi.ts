import type { Incident, IncidentStatus } from '../types'
import { getIncidentSeverity, isCriticalIncident } from '../utils/severity'
import type { IncidentApiDto } from './incidentsDto'

const validStatuses = new Set<IncidentStatus>([
  'reported',
  'unverified',
  'verified',
  'dispatched',
  'on scene',
  'contained',
  'recovery',
  'closed',
])

export async function fetchIncidents() {
  const response = await fetch('/api/incidents')

  if (!response.ok) {
    throw new Error('Unable to load incidents')
  }

  const incidents = (await response.json()) as IncidentApiDto[]
  return incidents.map(mapIncidentFromApi)
}

export async function fetchIncident(id: string) {
  const response = await fetch(`/api/incidents/${id}`)

  if (!response.ok) {
    throw new Error('Unable to load incident')
  }

  const incident = (await response.json()) as IncidentApiDto
  return mapIncidentFromApi(incident)
}

function mapIncidentFromApi(apiIncident: IncidentApiDto): Incident {
  const severity = getIncidentSeverity(apiIncident.severity)

  return {
    assignedOrgs: apiIncident.assignedOrgs,
    confidenceScore: apiIncident.confidenceScore ?? undefined,
    createdAt: formatIncidentDate(apiIncident.createdAt),
    date: formatIncidentDate(apiIncident.createdAt),
    description: apiIncident.description ?? '',
    id: apiIncident.id,
    incidentCode: apiIncident.incidentCode,
    incidentType: apiIncident.incidentType,
    isCritical: isCriticalIncident(severity),
    location: apiIncident.location ?? '',
    resolvedAt: apiIncident.resolvedAt ? formatIncidentDate(apiIncident.resolvedAt) : undefined,
    severity,
    status: getIncidentStatus(apiIncident.status),
    title: apiIncident.title,
    updatedAt: formatIncidentDate(apiIncident.updatedAt),
  }
}

function getIncidentStatus(status: string): IncidentStatus {
  return validStatuses.has(status as IncidentStatus) ? (status as IncidentStatus) : 'reported'
}

function formatIncidentDate(date: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}
