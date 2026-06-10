import type { Incident } from '../../../responder/incidents/types'
import { ALL } from '../../../shared/map/filterState'
import type {
  OverviewFilterState,
  OverviewView,
} from '../../../shared/map/filterState'
import { GOVERNMENT_MAP_SEVERITY_ORDER } from '../constants'

export function distinct(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort()
}

export function matchesGovernmentMapView(
  incident: Incident,
  view: OverviewView,
): boolean {
  switch (view) {
    case 'history':
      return incident.status === 'closed'
    case 'critical':
      return incident.status !== 'closed' && incident.isCritical
    case 'active':
    default:
      return incident.status !== 'closed'
  }
}

export function matchesGovernmentMapFilters(
  incident: Incident,
  filters: OverviewFilterState,
): boolean {
  if (filters.type !== ALL && incident.incidentType !== filters.type) return false
  if (filters.severity !== ALL && incident.severity !== filters.severity) return false
  if (filters.agency !== ALL && !(incident.assignedOrgs ?? []).includes(filters.agency)) {
    return false
  }
  return true
}

export function getGovernmentMapFilterOptions(incidents: Incident[]) {
  const presentSeverities = new Set(incidents.map((incident) => incident.severity))

  return {
    agencies: distinct(incidents.flatMap((incident) => incident.assignedOrgs ?? [])),
    severities: GOVERNMENT_MAP_SEVERITY_ORDER.filter((severity) =>
      presentSeverities.has(severity),
    ),
    types: distinct(incidents.map((incident) => incident.incidentType)),
  }
}

export function getGovernmentMapViewCounts(incidents: Incident[]) {
  return {
    active: incidents.filter((incident) => matchesGovernmentMapView(incident, 'active')).length,
    critical: incidents.filter((incident) => matchesGovernmentMapView(incident, 'critical')).length,
    history: incidents.filter((incident) => matchesGovernmentMapView(incident, 'history')).length,
  }
}

export function getGovernmentMapIncidents(
  incidents: Incident[],
  filters: OverviewFilterState,
) {
  return incidents.filter(
    (incident) =>
      matchesGovernmentMapView(incident, filters.view) &&
      matchesGovernmentMapFilters(incident, filters),
  )
}
