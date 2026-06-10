import type {
  IncidentSeverity,
  IncidentStatus,
} from '../../../responder/incidents/types'

export type OverviewIncident = {
  assignedOrgs?: string[]
  date: string
  id: string
  incidentCode?: string
  incidentType?: string
  isCritical: boolean
  lat?: number | null
  lng?: number | null
  location: string
  resources?: Array<unknown>
  severity?: IncidentSeverity
  status: IncidentStatus
  title: string
}

