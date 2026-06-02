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
