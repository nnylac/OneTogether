export type IncidentStatus =
  | 'reported'
  | 'unverified'
  | 'verified'
  | 'dispatched'
  | 'on scene'
  | 'contained'
  | 'recovery'
  | 'closed'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type Incident = {
  assignedOrgs?: string[]
  confidenceScore?: number
  createdAt?: string
  incidentCode?: string
  incidentCommander?: string
  incidentType?: string
  id: string
  title: string
  location: string
  description: string
  resolvedAt?: string
  severity?: IncidentSeverity
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

export type IncidentResourceStatus = 'dispatched' | 'on scene' | 'engaged'

export type IncidentResource = {
  id: string
  unit: string
  agency: string
  type: string
  assignedAt: string
  status: IncidentResourceStatus
  notes: string
}
