import type { IncidentSeverity } from '../../../responder/incidents/types'

export type BroadcastAudience = 'Public' | 'Responders' | 'Zone'

export type BroadcastZone =
  | 'Nationwide'
  | 'Central'
  | 'East'
  | 'West'
  | 'North'
  | 'South'

export type BroadcastSeverity = IncidentSeverity

export type BroadcastFilter =
  | 'All'
  | BroadcastAudience
  | BroadcastSeverity

export type GovernmentBroadcast = {
  id: string
  title: string
  message: string
  audience: BroadcastAudience
  zone?: BroadcastZone
  severity: BroadcastSeverity
  authorName: string
  createdAt: string
}

export type NewBroadcastInput = {
  title: string
  message: string
  audience: BroadcastAudience
  zone: BroadcastZone
  severity: BroadcastSeverity
}