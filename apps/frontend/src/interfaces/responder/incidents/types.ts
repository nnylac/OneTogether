export type IncidentStatus =
  | 'reported'
  | 'unverified'
  | 'verified'
  | 'dispatched'
  | 'on scene'
  | 'contained'
  | 'recovery'
  | 'closed'

export type Incident = {
  id: string
  title: string
  location: string
  description: string
  status: IncidentStatus
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
