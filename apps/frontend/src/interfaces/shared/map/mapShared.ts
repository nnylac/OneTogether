import type { ElementType } from 'react'
import {
  AlertTriangle,
  Ambulance,
  Building2,
  Car,
  CloudRain,
  Flame,
  FlaskConical,
  Shield,
  Siren,
  UserSearch,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import type {
  IncidentSeverity,
  IncidentStatus,
} from '../../responder/incidents/types'
import type { LabelBoxTone } from '../../../components/ui/LabelBox'

export const SINGAPORE_CENTRE = { lat: 1.3521, lng: 103.8198 }
export const MAP_ID = 'DEMO_MAP_ID'

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

type TypeMeta = { icon: ElementType; label: string }

const CANONICAL_TYPES: Record<string, TypeMeta> = {
  TRAFFIC_ACCIDENT: { icon: Car, label: 'Traffic accident' },
  BUILDING_FIRE: { icon: Flame, label: 'Building fire' },
  FLOODING: { icon: Waves, label: 'Flooding' },
  MEDICAL_EMERGENCY: { icon: Ambulance, label: 'Medical emergency' },
  GAS_LEAK: { icon: FlaskConical, label: 'Gas leak' },
  BUILDING_COLLAPSE: { icon: Building2, label: 'Building collapse' },
  MISSING_PERSON: { icon: UserSearch, label: 'Missing person' },
  DISEASE_OUTBREAK: { icon: AlertTriangle, label: 'Disease outbreak' },
  HAZE: { icon: Wind, label: 'Haze' },
  CIVIL_DISTURBANCE: { icon: Shield, label: 'Civil disturbance' },
}

const TYPE_RULES: Array<{ match: RegExp; icon: ElementType }> = [
  { match: /fire|smoke|blaze/, icon: Flame },
  { match: /medical|cardiac|casualt|ambulance|health|injur/, icon: Ambulance },
  { match: /police|security|crime|terror|attack|riot|disturbance/, icon: Shield },
  { match: /flood|water|tidal|drain/, icon: Waves },
  { match: /haze|weather|storm|rain|wind|lightning/, icon: CloudRain },
  { match: /power|outage|electric|grid/, icon: Zap },
  { match: /chemical|hazmat|gas|leak|toxic/, icon: FlaskConical },
  { match: /traffic|road|mrt|rail|train|vehicle|collision/, icon: Car },
  { match: /missing|person/, icon: UserSearch },
  { match: /collapse|structural/, icon: Building2 },
]

export function typeMeta(incidentType: string | undefined): TypeMeta {
  const raw = (incidentType ?? '').trim()
  const canonical = CANONICAL_TYPES[raw.toUpperCase()]
  if (canonical) return canonical

  const value = raw.toLowerCase()
  const rule = TYPE_RULES.find((candidate) => candidate.match.test(value))
  return { icon: rule?.icon ?? (value ? AlertTriangle : Siren), label: typeLabel(incidentType) }
}

export function typeLabel(incidentType: string | undefined): string {
  const raw = (incidentType ?? '').trim()
  if (!raw) return 'Incident'
  const canonical = CANONICAL_TYPES[raw.toUpperCase()]
  if (canonical) return canonical.label
  const words = raw.replace(/_/g, ' ').toLowerCase().trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function isActiveStatus(status: IncidentStatus): boolean {
  return status !== 'closed'
}

