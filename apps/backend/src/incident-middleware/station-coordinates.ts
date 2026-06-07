/**
 * Reference coordinates for resolving a dispatched unit's origin point.
 *
 * These are approximate real-world locations of SCDF fire stations (keyed by the
 * station codes the SCDF simulator emits — see apps/external/agencies/scdf/main.py)
 * plus agency-HQ fallbacks. This is static reference data, not fabricated telemetry:
 * it lets the map anchor a unit's start point so movement toward the incident can be
 * interpolated from real ETA + real origin + real incident coordinates.
 */

export type LatLng = { lat: number; lng: number };

/** SCDF fire-station codes emitted by the simulator → approximate station coordinates. */
export const SCDF_STATION_COORDINATES: Record<string, LatLng> = {
  CDS: { lat: 1.2966, lng: 103.8485 }, // Central Fire Station (Hill Street)
  TOA: { lat: 1.334, lng: 103.853 }, // Toa Payoh
  JRG: { lat: 1.333, lng: 103.722 }, // Jurong
  BDK: { lat: 1.325, lng: 103.93 }, // Bedok
  WDL: { lat: 1.436, lng: 103.786 }, // Woodlands
  ANG: { lat: 1.37, lng: 103.85 }, // Ang Mo Kio
  CLM: { lat: 1.317, lng: 103.765 }, // Clementi
  SGK: { lat: 1.392, lng: 103.895 }, // Sengkang
};

/** Agency HQ fallback when a unit has no station, or the station code is unknown. */
export const AGENCY_HQ_COORDINATES: Record<string, LatLng> = {
  SCDF: { lat: 1.333, lng: 103.9 }, // SCDF HQ, Ubi Ave 4
  SPF: { lat: 1.3008, lng: 103.8479 }, // Police Cantonment Complex
  SINGHEALTH: { lat: 1.2796, lng: 103.8352 }, // SGH campus
  NUHS: { lat: 1.2942, lng: 103.7836 }, // NUH
  PUB: { lat: 1.3047, lng: 103.8243 }, // PUB / WaterHub area
  NEA: { lat: 1.3331, lng: 103.7421 }, // Environment Building proxy
};

/** Last-resort centre of Singapore. */
export const SINGAPORE_CENTRE: LatLng = { lat: 1.3521, lng: 103.8198 };

/** Average ground-unit speed used to derive an ETA when the payload omits one. */
const AVERAGE_SPEED_KMH = 40;

/**
 * Resolve a unit's origin coordinate from its station code, falling back to the
 * agency HQ and finally the centre of Singapore.
 */
export function resolveOriginCoordinates(
  agency: string,
  station?: string | null,
): LatLng {
  if (station) {
    const stationCoord = SCDF_STATION_COORDINATES[station.toUpperCase()];
    if (stationCoord) {
      return stationCoord;
    }
  }

  return AGENCY_HQ_COORDINATES[agency.toUpperCase()] ?? SINGAPORE_CENTRE;
}

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(from: LatLng, to: LatLng): number {
  const earthRadiusKm = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Derive an ETA (whole minutes) from the straight-line distance between origin and
 * destination at an assumed average speed. Used only when the simulator payload does
 * not provide an explicit eta_minutes. Always at least 1 minute.
 */
export function estimateEtaMinutes(
  origin: LatLng,
  destination: LatLng,
): number {
  const distanceKm = haversineKm(origin, destination);
  const minutes = (distanceKm / AVERAGE_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}
