export type IncidentLogApiDto = {
  content: string
  createdAt: string
  id: string
}

export type IncidentDiscussionApiDto = {
  createdAt: string
  id: string
  title: string
  updatedAt: string
}

export type IncidentApiDto = {
  assignedOrgs: string[]
  confidenceScore: number | null
  createdAt: string
  description: string | null
  discussions?: IncidentDiscussionApiDto[]
  id: string
  incidentCode: string
  incidentType: string
  location: string | null
  logs?: IncidentLogApiDto[]
  report: string | null
  resolvedAt: string | null
  severity: number
  status: string
  title: string
  updatedAt: string
}
