import type { ElementType } from 'react'
import { Ambulance, Flame, LifeBuoy, Shield, Truck } from 'lucide-react'
import type { IncidentMapResourceDto } from '../api/incidentMapDto'

export type LatLng = { lat: number; lng: number }

type KindMeta = { label: string; icon: ElementType }

export const KIND_META: Record<string, KindMeta> = {
  fire_engine: { label: 'Fire engine', icon: Flame },
  rescue_team: { label: 'Rescue team', icon: LifeBuoy },
  ambulance: { label: 'Ambulance', icon: Ambulance },
  police: { label: 'Police', icon: Shield },
  other: { label: 'Unit', icon: Truck },
}

export const STATUS_META: Record<string, { label: string; color: string }> = {
  dispatched: { label: 'Dispatched', color: '#3b82f6' },
  en_route: { label: 'En route', color: '#f59e0b' },
  on_scene: { label: 'On scene', color: '#22c55e' },
  returning: { label: 'Returning', color: '#a855f7' },
  unavailable: { label: 'Unavailable', color: '#9ca3af' },
  completed: { label: 'Completed', color: '#14b8a6' },
}

/** Statuses where a unit is still travelling toward the incident. */
export const MOVING_STATUSES = new Set(['dispatched', 'en_route'])

/** Statuses where a unit has reached the incident (nothing left to travel). */
export const ARRIVED_STATUSES = new Set(['on_scene', 'completed'])

/** Agency badge colours so a unit's owning agency reads at a glance. */
export const AGENCY_META: Record<string, { color: string }> = {
  SCDF: { color: '#d7263d' },
  SPF: { color: '#1d3f8a' },
  SGH: { color: '#0d9488' },
  SINGHEALTH: { color: '#0d9488' },
  NUHS: { color: '#0d9488' },
  PUB: { color: '#2563eb' },
  NEA: { color: '#16a34a' },
}

export function kindMeta(kind: string): KindMeta {
  return KIND_META[kind] ?? KIND_META.other
}

export function agencyColor(agency: string): string {
  return AGENCY_META[agency?.toUpperCase()]?.color ?? '#374151'
}

export function statusColor(status: string): string {
  return STATUS_META[status]?.color ?? '#9ca3af'
}

export function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function originOf(resource: IncidentMapResourceDto): LatLng | null {
  return resource.originLat != null && resource.originLng != null
    ? { lat: resource.originLat, lng: resource.originLng }
    : null
}

export function destinationOf(resource: IncidentMapResourceDto): LatLng | null {
  return resource.destLat != null && resource.destLng != null
    ? { lat: resource.destLat, lng: resource.destLng }
    : null
}

/** Fraction of the journey a unit has completed, derived from real ETA + dispatch time. */
export function progressOf(resource: IncidentMapResourceDto, nowMs: number): number {
  if (ARRIVED_STATUSES.has(resource.status) || resource.status === 'returning') {
    return 1
  }
  if (resource.status === 'unavailable') {
    return 0
  }
  if (!MOVING_STATUSES.has(resource.status)) {
    return 0
  }

  const start = Date.parse(resource.dispatchedAt)
  const end = resource.etaAt ? Date.parse(resource.etaAt) : Number.NaN
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }
  return clamp01((nowMs - start) / (end - start))
}

/** Great-circle distance between two points in kilometres. */
export function haversineKm(from: LatLng, to: LatLng): number {
  const earthRadiusKm = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Straight-line distance the unit still has to travel, scaled by how far along its
 * journey it is. Returns 0 once arrived and null when origin/destination is unknown.
 */
export function remainingKm(resource: IncidentMapResourceDto, nowMs: number): number | null {
  if (ARRIVED_STATUSES.has(resource.status)) {
    return 0
  }
  const origin = originOf(resource)
  const destination = destinationOf(resource)
  if (!origin || !destination) {
    return null
  }
  const total = haversineKm(origin, destination)
  return total * (1 - progressOf(resource, nowMs))
}

/** Live ETA in whole minutes from the absolute ETA, falling back to the stored estimate. */
export function liveEtaMinutes(resource: IncidentMapResourceDto, nowMs: number): number | null {
  if (resource.etaAt) {
    const end = Date.parse(resource.etaAt)
    if (Number.isFinite(end)) {
      return Math.max(0, Math.round((end - nowMs) / 60_000))
    }
  }
  return resource.etaMinutes
}
