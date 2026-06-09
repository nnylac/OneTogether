import type { IncidentSeverity } from '../../../responder/incidents/types'
import type { IncidentResourceApiDto } from '../../../responder/incidents/api/incidentsDto'

export type GovernmentIncidentStatus =
  | 'reported'
  | 'triage'
  | 'responding'
  | 'on_scene'
  | 'stabilising'
  | 'monitoring'
  | 'resolved'
  | 'closed'

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
  agencyProgress: Array<{
    agency: string
    stage: string
    updatedAt: string
  }>
  volunteerCount: number
  severity: IncidentSeverity
  incidentType: string
  status: GovernmentIncidentStatus
}
