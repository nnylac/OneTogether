import type { IncidentSeverity } from '../../responder/incidents/types'

export const governmentMapPollingIntervalMs = 10000

export const GOVERNMENT_MAP_SEVERITY_ORDER: IncidentSeverity[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
]

