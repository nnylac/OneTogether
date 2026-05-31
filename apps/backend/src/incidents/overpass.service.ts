import { Injectable, Logger } from '@nestjs/common';

export interface NearbyInfrastructure {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceMetres: number;
  relevanceReason: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
}

// Priority order per incident type
const TYPE_PRIORITY: Record<string, string[]> = {
  Medical:        ['hospital', 'clinic', 'pharmacy'],
  Fire:           ['fire_station', 'hospital'],
  Flood:          ['fire_station', 'shelter', 'hospital'],
  Infrastructure: ['fire_station', 'hospital', 'police'],
  Civil:          ['police', 'hospital'],
  Road:           ['hospital', 'police'],
  Other:          ['hospital', 'fire_station', 'police', 'clinic', 'pharmacy', 'shelter'],
};

const TYPE_LABEL: Record<string, string> = {
  hospital: 'Hospital',
  fire_station: 'Fire Station',
  police: 'Police Station',
  clinic: 'Clinic',
  pharmacy: 'Pharmacy',
  shelter: 'Emergency Shelter',
};

interface CacheEntry { data: NearbyInfrastructure[]; expires: number; }

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  async getNearby(
    lat: number,
    lng: number,
    incidentType: string,
    radius = 2000,
  ): Promise<NearbyInfrastructure[]> {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${incidentType},${radius}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) return cached.data;

    const amenityTypes = 'hospital|fire_station|police|clinic|pharmacy|shelter';
    const query = `[out:json][timeout:15];(node(around:${radius},${lat},${lng})[amenity~"${amenityTypes}"];way(around:${radius},${lat},${lng})[amenity~"${amenityTypes}"];);out center tags;`;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'OneTogether-EmergencyPlatform/1.0' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) { this.logger.warn(`Overpass HTTP ${res.status}`); return []; }

      const json = await res.json() as { elements: OverpassElement[] };
      const results = this.processElements(json.elements, lat, lng, incidentType);

      this.cache.set(key, { data: results, expires: Date.now() + this.TTL });
      this.logger.log(`Overpass: ${results.length} infrastructure items near (${lat.toFixed(4)},${lng.toFixed(4)})`);
      return results;
    } catch (err) {
      this.logger.warn(`Overpass failed: ${String(err)}`);
      return [];
    }
  }

  private processElements(
    elements: OverpassElement[],
    incidentLat: number,
    incidentLng: number,
    incidentType: string,
  ): NearbyInfrastructure[] {
    const priority = TYPE_PRIORITY[incidentType] ?? TYPE_PRIORITY['Other'];

    const items: NearbyInfrastructure[] = elements
      .filter(el => {
        const name = el.tags?.name;
        const amenity = el.tags?.amenity;
        return name && amenity; // skip unnamed or untyped elements
      })
      .map(el => {
        const elLat = el.type === 'node' ? el.lat! : el.center!.lat;
        const elLng = el.type === 'node' ? el.lon! : el.center!.lon;
        const dist = this.haversineMetres(incidentLat, incidentLng, elLat, elLng);
        const amenity = el.tags!.amenity!;
        const typeLabel = TYPE_LABEL[amenity] ?? amenity.replace(/_/g, ' ');
        const priorityIdx = priority.indexOf(amenity);

        return {
          id: String(el.id),
          name: el.tags!.name!,
          type: amenity,
          lat: elLat,
          lng: elLng,
          distanceMetres: Math.round(dist),
          relevanceReason: this.buildReason(amenity, dist, incidentType, priorityIdx),
          phone: el.tags?.phone ?? el.tags?.['contact:phone'],
          website: el.tags?.website ?? el.tags?.['contact:website'],
          openingHours: el.tags?.opening_hours,
          operator: el.tags?.operator,
        } satisfies NearbyInfrastructure;
      });

    // Sort: prioritised types first, then by distance within each tier
    return items.sort((a, b) => {
      const pa = priority.indexOf(a.type) === -1 ? 999 : priority.indexOf(a.type);
      const pb = priority.indexOf(b.type) === -1 ? 999 : priority.indexOf(b.type);
      if (pa !== pb) return pa - pb;
      return a.distanceMetres - b.distanceMetres;
    });
  }

  private buildReason(amenity: string, dist: number, incidentType: string, priorityIdx: number): string {
    const label = TYPE_LABEL[amenity] ?? amenity;
    const distStr = dist < 1000 ? `${Math.round(dist)}m away` : `${(dist / 1000).toFixed(1)}km away`;
    if (priorityIdx === 0) return `Primary response resource · ${distStr}`;
    if (priorityIdx === 1) return `Supporting resource · ${distStr}`;
    return `Relevant to ${incidentType} incident · ${distStr}`;
  }

  private haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
