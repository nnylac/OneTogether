import type { IncidentMapResourceDto } from './incidentMapDto'

export type LatLng = { lat: number; lng: number }

/** Backend resource statuses, with display colour + label. */
export const STATUS_META: Record<string, { label: string; color: string }> = {
  dispatched: { label: 'Dispatched', color: '#3b82f6' },
  en_route: { label: 'En route', color: '#f59e0b' },
  on_scene: { label: 'On scene', color: '#22c55e' },
  returning: { label: 'Returning', color: '#a855f7' },
  unavailable: { label: 'Unavailable', color: '#9ca3af' },
  completed: { label: 'Completed', color: '#14b8a6' },
}

/** Statuses whose marker is actively travelling origin -> incident. */
export const MOVING_STATUSES = new Set(['dispatched', 'en_route'])

export function statusColor(status: string): string {
  return STATUS_META[status]?.color ?? '#9ca3af'
}

export function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status
}

/**
 * Simplified movement state for situational-awareness displays.
 * Collapses the backend statuses into the four states operators reason about.
 */
export type MovementState = 'idle' | 'dispatched' | 'en_route' | 'arrived' | 'returning'

const MOVEMENT_STATE_LABEL: Record<MovementState, string> = {
  idle: 'Idle',
  dispatched: 'Dispatched',
  en_route: 'En route',
  arrived: 'Arrived',
  returning: 'Returning',
}

/** Derives the coarse movement state from a backend status + journey progress. */
export function movementState(status: string, progress: number): MovementState {
  if (status === 'on_scene' || status === 'completed') return 'arrived'
  if (status === 'returning') return 'returning'
  if (status === 'unavailable') return 'idle'
  if (status === 'dispatched') return progress > 0 ? 'en_route' : 'dispatched'
  if (status === 'en_route') return progress >= 1 ? 'arrived' : 'en_route'
  return 'idle'
}

export function movementStateLabel(state: MovementState): string {
  return MOVEMENT_STATE_LABEL[state]
}

/** Colour for a movement state, reusing the backend-status palette. */
export function movementStateColor(state: MovementState): string {
  if (state === 'arrived') return STATUS_META.on_scene.color
  if (state === 'en_route') return STATUS_META.en_route.color
  if (state === 'dispatched') return STATUS_META.dispatched.color
  if (state === 'returning') return STATUS_META.returning.color
  return STATUS_META.unavailable.color
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
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
  if (
    resource.status === 'on_scene' ||
    resource.status === 'completed' ||
    resource.status === 'returning'
  ) {
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

const EARTH_RADIUS_M = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two points, in metres. */
export function haversineMeters(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Straight-line distance still to travel, in metres (origin -> incident scaled by remaining progress). */
export function remainingMeters(
  resource: IncidentMapResourceDto,
  nowMs: number,
): number | null {
  const origin = originOf(resource)
  const destination = destinationOf(resource)
  if (!origin || !destination) return null
  const total = haversineMeters(origin, destination)
  return total * (1 - progressOf(resource, nowMs))
}

/** Compact "1.2 km" / "640 m" distance label. */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

/** Local HH:mm clock label for an ISO timestamp; empty string when unparseable. */
export function formatClock(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ''
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
