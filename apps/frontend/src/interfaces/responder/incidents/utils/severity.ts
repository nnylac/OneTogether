import type { IncidentSeverity } from '../types'

export function getIncidentSeverity(severity: number): IncidentSeverity {
  if (severity >= 5) {
    return 'Critical'
  }

  if (severity >= 4) {
    return 'High'
  }

  if (severity >= 2) {
    return 'Medium'
  }

  return 'Low'
}

export function isCriticalIncident(severity: IncidentSeverity) {
  return severity === 'Critical' || severity === 'High'
}
