export type IncidentStatus = 'active' | 'closed' | 'resolved'

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type Incident = {
  assignedOrgs?: string[]
  confidenceScore?: number
  createdAt?: string
  discussions?: Array<{
    createdAt: string
    id: string
    title: string
    updatedAt: string
  }>
  incidentCode?: string
  incidentCommander?: string
  incidentType?: string
  id: string
  title: string
  location: string
  description: string
  logs?: IncidentLogEntry[]
  report?: string | null
  resolvedAt?: string
  resources?: IncidentResource[]
  severity?: IncidentSeverity
  sourceLinks?: Array<{
    externalTicketId: string
    lastSyncedAt: string
  }>
  status: IncidentStatus
  updatedAt?: string
  zone?: string
  isCritical: boolean
  date: string
}

export type IncidentLogCategory = 'initial' | 'status' | 'deploy' | 'medical' | 'note'

export type IncidentLogEntry = {
  id: string
  category: IncidentLogCategory
  source: string
  author: string
  body: string
  time: string
}

export type IncidentReportDraft = {
  incidentName: string
  incidentDate: string
  incidentDescription: string
  responsePlan: string
  otherNotes: string
}

export type IncidentResourceStatus = 'DISPATCHED' | 'ON SCENE' | 'COMPLETED'

export type IncidentResource = {
  id: string
  organisationId?: string
  unit: string
  agency: string
  type: string
  assignedAt: string
  status: IncidentResourceStatus
  notes: string
}
