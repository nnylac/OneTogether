import type { IncidentSeverity } from '../../../responder/incidents/types'
import type { IncidentResourceApiDto } from '../../../responder/incidents/api/incidentsDto'

export type GovernmentIncidentStatus = 'active' | 'closed'

export type GovernmentIncidentFilter =
  | 'All'
  | IncidentSeverity
  | GovernmentIncidentStatus

export type GovernmentIncident = {
  id: string
  title: string
  description: string | null
  location: string | null
  createdAt: string
  assignedOrgs: string[]
  assignedResources: IncidentResourceApiDto[]
  volunteerCount: number
  severity: IncidentSeverity
  incidentType: string
  status: GovernmentIncidentStatus
}
