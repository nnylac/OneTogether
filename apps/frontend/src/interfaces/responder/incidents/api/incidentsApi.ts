import type {
  Incident,
  IncidentLogCategory,
  IncidentResourceStatus,
  IncidentStatus,
} from '../types'
import { getIncidentSeverity, isCriticalIncident } from '../utils/severity'
import type { IncidentApiDto, IncidentLogApiDto, OrganisationApiDto } from './incidentsDto'

const validStatuses = new Set<IncidentStatus>([
  'active',
  'closed',
  'resolved',
])

const validResourceStatuses = new Set<IncidentResourceStatus>([
  'dispatched',
  'on scene',
  'engaged',
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

export async function fetchOrganisations() {
  const response = await fetch('/api/organisations')

  if (!response.ok) {
    throw new Error('Unable to load organisations')
  }

  return (await response.json()) as OrganisationApiDto[]
}

export async function assignOrganisationToIncident(incidentId: string, organisationId: string) {
  const response = await fetch(`/api/incidents/${incidentId}/organisations`, {
    body: JSON.stringify({ organisationId }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to assign organisation')
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
    logs: apiIncident.logs?.map((log) => mapIncidentLogFromApi(log, apiIncident)),
    report: apiIncident.report,
    resolvedAt: apiIncident.resolvedAt ? formatIncidentDate(apiIncident.resolvedAt) : undefined,
    resources: apiIncident.assignedResources?.map((resource) => ({
      agency: resource.agency,
      assignedAt: formatIncidentDate(resource.assignedAt),
      id: resource.id,
      notes: resource.notes,
      status: getIncidentResourceStatus(resource.status),
      type: resource.type,
      unit: resource.unit,
    })),
    severity,
    sourceLinks: apiIncident.sourceLinks?.map((sourceLink) => ({
      externalTicketId: sourceLink.externalTicketId,
      lastSyncedAt: formatIncidentDate(sourceLink.lastSyncedAt),
    })),
    status: getIncidentStatus(apiIncident.status),
    title: apiIncident.title,
    updatedAt: formatIncidentDate(apiIncident.updatedAt),
  }
}

function mapIncidentLogFromApi(log: IncidentLogApiDto, incident: IncidentApiDto) {
  return {
    author: incident.assignedOrgs[0] ?? 'System',
    body: log.content,
    category: getIncidentLogCategory(log.content),
    id: log.id,
    source: incident.assignedOrgs[0] ?? 'System',
    time: formatIncidentTime(log.createdAt),
  }
}

function getIncidentStatus(status: string): IncidentStatus {
  const normalizedStatus = status.toLowerCase()

  return validStatuses.has(normalizedStatus as IncidentStatus)
    ? (normalizedStatus as IncidentStatus)
    : 'active'
}

function getIncidentResourceStatus(status: string): IncidentResourceStatus {
  return validResourceStatuses.has(status as IncidentResourceStatus)
    ? (status as IncidentResourceStatus)
    : 'engaged'
}

function getIncidentLogCategory(content: string): IncidentLogCategory {
  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('dispatch') || lowerContent.includes('assigned')) {
    return 'deploy'
  }

  if (lowerContent.includes('status') || lowerContent.includes('verified') || lowerContent.includes('closed')) {
    return 'status'
  }

  if (lowerContent.includes('smoke') || lowerContent.includes('medical') || lowerContent.includes('casualt')) {
    return 'medical'
  }

  if (lowerContent.includes('reported') || lowerContent.includes('received')) {
    return 'initial'
  }

  return 'note'
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

function formatIncidentTime(date: string) {
  return new Intl.DateTimeFormat('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
