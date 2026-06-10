import { SINGAPORE_CENTRE } from './mapShared'
import type { OverviewIncident } from './types/overviewIncident'

export type CoordinateSource = 'exact' | 'approximate'

export type ResolvedCoordinates = {
  lat: number
  lng: number
  source: CoordinateSource
}

type LatLng = { lat: number; lng: number }

const SINGAPORE_GAZETTEER: Record<string, LatLng> = {
  'jurong island': { lat: 1.2658, lng: 103.6953 },
  'jurong east': { lat: 1.3329, lng: 103.7421 },
  'jurong west': { lat: 1.3404, lng: 103.709 },
  'marine parade': { lat: 1.302, lng: 103.9053 },
  'pasir ris': { lat: 1.3817, lng: 103.9532 },
  'boon lay': { lat: 1.3388, lng: 103.7061 },
  'ang mo kio': { lat: 1.3726, lng: 103.8496 },
  'bukit timah': { lat: 1.3371, lng: 103.7834 },
  'bukit batok': { lat: 1.3491, lng: 103.7493 },
  'bukit merah': { lat: 1.2819, lng: 103.8239 },
  'bukit panjang': { lat: 1.3774, lng: 103.7719 },
  'choa chu kang': { lat: 1.3854, lng: 103.7443 },
  'toa payoh': { lat: 1.3329, lng: 103.8484 },
  'telok blangah': { lat: 1.2654, lng: 103.8216 },
  'west coast': { lat: 1.3059, lng: 103.7886 },
  woodlands: { lat: 1.4479, lng: 103.7783 },
  punggol: { lat: 1.4071, lng: 103.9076 },
  geylang: { lat: 1.3114, lng: 103.8896 },
  kallang: { lat: 1.3109, lng: 103.8726 },
  tengah: { lat: 1.3622, lng: 103.7294 },
  outram: { lat: 1.2804, lng: 103.8449 },
  clementi: { lat: 1.3151, lng: 103.7651 },
  tuas: { lat: 1.3294, lng: 103.6476 },
  museum: { lat: 1.2993, lng: 103.845 },
  serangoon: { lat: 1.3629, lng: 103.8664 },
  sengkang: { lat: 1.3951, lng: 103.8938 },
  bedok: { lat: 1.3238, lng: 103.9301 },
  tampines: { lat: 1.353, lng: 103.9457 },
  hougang: { lat: 1.3713, lng: 103.8924 },
  yishun: { lat: 1.4304, lng: 103.835 },
  sembawang: { lat: 1.4491, lng: 103.82 },
  'pasir panjang': { lat: 1.2766, lng: 103.7918 },
  novena: { lat: 1.3203, lng: 103.8439 },
  newton: { lat: 1.3138, lng: 103.8381 },
  bishan: { lat: 1.3508, lng: 103.8485 },
  queenstown: { lat: 1.2946, lng: 103.806 },
  'marina bay': { lat: 1.2834, lng: 103.8607 },
  orchard: { lat: 1.3048, lng: 103.8318 },
  changi: { lat: 1.3644, lng: 103.9915 },
  rochor: { lat: 1.3036, lng: 103.8523 },
  'river valley': { lat: 1.2935, lng: 103.8349 },
  central: { lat: 1.305, lng: 103.8317 },
}

const GAZETTEER_KEYS = Object.keys(SINGAPORE_GAZETTEER).sort(
  (a, b) => b.length - a.length,
)

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function jitterFor(seed: string): LatLng {
  const hash = hashString(seed)
  const u = ((hash & 0xffff) / 0xffff) * 2 - 1
  const v = (((hash >>> 16) & 0xffff) / 0xffff) * 2 - 1
  const radius = 0.0022
  return { lat: u * radius, lng: v * radius }
}

function matchGazetteer(location: string | null | undefined): LatLng | null {
  if (!location) return null
  const haystack = location.toLowerCase()
  for (const key of GAZETTEER_KEYS) {
    if (haystack.includes(key)) {
      return SINGAPORE_GAZETTEER[key]
    }
  }
  return null
}

export function resolveIncidentCoordinates(
  incident: OverviewIncident,
): ResolvedCoordinates {
  if (typeof incident.lat === 'number' && typeof incident.lng === 'number') {
    return { lat: incident.lat, lng: incident.lng, source: 'exact' }
  }

  const base = matchGazetteer(incident.location) ?? SINGAPORE_CENTRE
  const offset = jitterFor(incident.id)
  return {
    lat: base.lat + offset.lat,
    lng: base.lng + offset.lng,
    source: 'approximate',
  }
}

