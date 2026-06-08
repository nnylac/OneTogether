import { Injectable, Logger } from '@nestjs/common';

export type LatLng = { lat: number; lng: number };

export type DirectionsRequest = {
  origin: LatLng;
  destination: LatLng;
};

export type DirectionsResponse = {
  path: LatLng[];
  distance: number; // meters
  duration: number; // seconds
  error?: string;
};

@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://maps.googleapis.com/maps/api/directions/json';

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Get driving directions between two points using Google Maps Directions API.
   * Returns the route path as LatLng coordinates, distance in meters, and duration in seconds.
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResponse> {
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_API_KEY not configured, using fallback route',
      );
      return this.fallbackRoute(request.origin, request.destination);
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set(
        'origin',
        `${request.origin.lat},${request.origin.lng}`,
      );
      url.searchParams.set(
        'destination',
        `${request.destination.lat},${request.destination.lng}`,
      );
      url.searchParams.set('mode', 'driving');
      url.searchParams.set('units', 'metric');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK') {
        this.logger.warn(
          `Directions API error: ${data.status} - ${data.error_message}`,
        );
        return this.fallbackRoute(request.origin, request.destination);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode the overview polyline to get the path
      const path = this.decodePolyline(route.overview_polyline.points);

      return {
        path,
        distance: leg.distance.value,
        duration: leg.duration.value,
      };
    } catch (error) {
      this.logger.error('Directions API request failed', error);
      return this.fallbackRoute(request.origin, request.destination);
    }
  }

  /**
   * Fallback to a simple curved route when API is unavailable.
   * This maintains the existing mock route behavior.
   */
  private fallbackRoute(
    origin: LatLng,
    destination: LatLng,
  ): DirectionsResponse {
    const latDiff = destination.lat - origin.lat;
    const lngDiff = destination.lng - origin.lng;
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    const offset = 0.005;
    const waypoint = {
      lat: midLat + (lngDiff > 0 ? offset : -offset) * 0.3,
      lng: midLng + (latDiff > 0 ? -offset : offset) * 0.3,
    };

    // Estimate distance using haversine formula
    const distance = this.haversineKm(origin, destination) * 1000;
    const duration = (distance / 1000 / 40) * 3600; // Assume 40 km/h

    return {
      path: [origin, waypoint, destination],
      distance,
      duration,
    };
  }

  /**
   * Decode Google's encoded polyline format.
   * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
   */
  private decodePolyline(encoded: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
  }

  /** Haversine distance in km */
  private haversineKm(from: LatLng, to: LatLng): number {
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
}
