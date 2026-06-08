import type { IncidentSeverity } from '../../../responder/incidents/types'

export type GovernmentIncidentStatus =
  | 'Open'
  | 'Triage'
  | 'Dispatched'
  | 'In Progress'
  | 'Resolved'

export type GovernmentIncidentVisibility = 'Public' | 'Private'

export type GovernmentIncidentFilter =
  | 'All'
  | IncidentSeverity
  | GovernmentIncidentStatus
  | GovernmentIncidentVisibility

export type GovernmentIncident = {
  id: string
  title: string
  description: string
  location: string
  createdAt: string
  assignedOrgs: string[]
  respondingUnits: number
  volunteerCount: number
  severity: IncidentSeverity
  incidentType: string
  visibility: GovernmentIncidentVisibility
  status: GovernmentIncidentStatus
}