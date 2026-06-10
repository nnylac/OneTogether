import type { ElementType } from 'react'
import {
  Ambulance,
  AlertTriangle,
  Car,
  CloudRain,
  Flame,
  FlaskConical,
  Shield,
  Siren,
  Waves,
  Zap,
} from 'lucide-react'
import type { IncidentSeverity, IncidentStatus } from '../incidents/types'
import type { LabelBoxTone } from '../../../components/ui/LabelBox'

/**
 * Shared map constants and visual helpers for the responder overview map.
 * Mirrors the Google Maps setup used by the single-incident `IncidentMap`
 * (same provider, map id, and Singapore framing) so the two views stay
 * visually consistent without coupling to that component's internals.
 */
export const SINGAPORE_CENTRE = { lat: 1.3521, lng: 103.8198 }
export const MAP_ID = 'DEMO_MAP_ID'

/** Marker / accent colour for an incident's severity label. */
export function severityColor(severity: IncidentSeverity | undefined): string {
  switch (severity) {
    case 'Critical':
      return '#ef4444'
    case 'High':
      return '#f97316'
    case 'Medium':
      return '#f59e0b'
    default:
      return '#3b82f6'
  }
}

/** LabelBox tone used for severity chips in the stat rail and list. */
export const severityTone: Record<IncidentSeverity, LabelBoxTone> = {
  Critical: 'red',
  High: 'orange',
  Medium: 'yellow',
  Low: 'blue',
}

export const statusTone: Record<IncidentStatus, LabelBoxTone> = {
  reported: 'yellow',
  triage: 'orange',
  responding: 'blue',
  on_scene: 'purple',
  stabilising: 'red',
  monitoring: 'yellow',
  resolved: 'green',
  closed: 'gray',
}

type TypeMeta = { icon: ElementType }

const TYPE_RULES: Array<{ match: RegExp; icon: ElementType }> = [
  { match: /fire|smoke|blaze/, icon: Flame },
  { match: /medical|cardiac|casualt|ambulance|health|injur/, icon: Ambulance },
  { match: /police|security|crime|terror|attack|riot/, icon: Shield },
  { match: /flood|water|tidal|drain/, icon: Waves },
  { match: /weather|storm|rain|wind|lightning/, icon: CloudRain },
  { match: /power|outage|electric|grid/, icon: Zap },
  { match: /chemical|hazmat|gas|leak|toxic/, icon: FlaskConical },
  { match: /traffic|road|mrt|rail|train|vehicle|collision/, icon: Car },
]

/** Best-effort icon for an incident type string (keyword matched). */
export function typeMeta(incidentType: string | undefined): TypeMeta {
  const value = (incidentType ?? '').toLowerCase()
  const rule = TYPE_RULES.find((candidate) => candidate.match.test(value))
  return { icon: rule?.icon ?? (value ? AlertTriangle : Siren) }
}

/** An incident is "active" while it has not been closed. */
export function isActiveStatus(status: IncidentStatus): boolean {
  return status !== 'closed'
}
