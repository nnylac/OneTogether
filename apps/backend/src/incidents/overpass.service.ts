import { Injectable, Logger } from '@nestjs/common';

export interface NearbyInfrastructure {
  id: string;
  name: string;
  type: string;
  tier: 1 | 2 | 3;
  lat: number;
  lng: number;
  distanceMetres: number;
  relevanceReason: string;
  status: 'operational' | 'busy' | 'unavailable' | 'unknown';
  phone?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  aiSuggested?: boolean;
  aiReason?: string;
}

// Tier definitions per incident type
const TIER_MAP: Record<string, { t1: string[]; t2: string[]; t3: string[] }> = {
  Medical:        { t1: ['hospital', 'ambulance_station'], t2: ['clinic', 'pharmacy'], t3: [] },
  Fire:           { t1: ['fire_station'], t2: ['hospital'], t3: [] },
  Flood:          { t1: ['fire_station', 'hospital'], t2: ['shelter', 'social_facility'], t3: ['water_works', 'pumping_station'] },
  Infrastructure: { t1: ['fire_station', 'hospital'], t2: ['police'], t3: ['power_substation', 'water_works'] },
  Civil:          { t1: ['police'], t2: ['hospital'], t3: [] },
  Road:           { t1: ['hospital', 'police'], t2: ['fire_station'], t3: [] },
  Other:          { t1: ['hospital'], t2: ['fire_station', 'police'], t3: [] },
};

const TYPE_LABEL: Record<string, string> = {
  hospital: 'Hospital', ambulance_station: 'Ambulance Station',
  fire_station: 'Fire Station', police: 'Police Station',
  clinic: 'Clinic', pharmacy: 'Pharmacy',
  shelter: 'Shelter', social_facility: 'Social Facility',
  water_works: 'Water Works', pumping_station: 'Pumping Station',
  power_substation: 'Power Substation',
};

interface CacheEntry { data: NearbyInfrastructure[]; expires: number; }

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly TTL = 10 * 60 * 1000;

  async getNearby(
    lat: number, lng: number, incidentType: string, radius = 2000,
  ): Promise<NearbyInfrastructure[]> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${incidentType}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) return cached.data;

    const tiers = TIER_MAP[incidentType] ?? TIER_MAP['Other'];
    // Universal: always include hospital at Tier 1
    const t1 = [...new Set(['hospital', ...tiers.t1])];
    const t2 = tiers.t2.filter(t => !t1.includes(t));
    const allTypes = [...new Set([...t1, ...t2])];

    const amenityFilter = allTypes.join('|');
    // Tier 1 uses 5km radius, Tier 2 uses 2km
    const t1Radius = Math.max(radius, 5000);
    const t2Radius = Math.min(radius, 2000);

    // Single query with larger radius; we'll filter by tier radius afterwards
    const query = `[out:json][timeout:15];(node(around:${t1Radius},${lat},${lng})[amenity~"${amenityFilter}"];way(around:${t1Radius},${lat},${lng})[amenity~"${amenityFilter}"];);out center tags;`;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'OneTogether-EmergencyPlatform/1.0' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) { this.logger.warn(`Overpass HTTP ${res.status}`); return []; }

      const json = await res.json() as { elements: OverpassElement[] };
      const results = this.processElements(json.elements, lat, lng, t1, t2, t2Radius, incidentType);

      this.cache.set(cacheKey, { data: results, expires: Date.now() + this.TTL });
      this.logger.log(`Overpass: ${results.length} items (T1:${results.filter(r=>r.tier===1).length} T2:${results.filter(r=>r.tier===2).length}) near (${lat.toFixed(4)},${lng.toFixed(4)})`);
      return results;
    } catch (err) {
      this.logger.warn(`Overpass failed: ${String(err)}`);
      return [];
    }
  }

  private processElements(
    elements: OverpassElement[],
    incidentLat: number, incidentLng: number,
    t1Types: string[], t2Types: string[],
    t2RadiusMetres: number,
    incidentType: string,
  ): NearbyInfrastructure[] {
    // Map and filter valid elements
    const mapped = elements
      .filter(el => el.tags?.name && el.tags?.amenity)
      .map(el => {
        const elLat = el.type === 'node' ? el.lat! : el.center!.lat;
        const elLng = el.type === 'node' ? el.lon! : el.center!.lon;
        const dist = this.haversineMetres(incidentLat, incidentLng, elLat, elLng);
        const amenity = el.tags!.amenity!;
        const tier: 1 | 2 | 3 = t1Types.includes(amenity) ? 1 : t2Types.includes(amenity) ? 2 : 3;

        // Enforce tier-specific radius
        if (tier === 2 && dist > t2RadiusMetres) return null;

        const item: NearbyInfrastructure = {
          id: String(el.id),
          name: el.tags!.name!,
          type: amenity,
          tier,
          lat: elLat,
          lng: elLng,
          distanceMetres: Math.round(dist),
          relevanceReason: this.buildReason(amenity, dist, incidentType, tier),
          status: 'unknown',
          phone: el.tags?.phone ?? el.tags?.['contact:phone'],
          website: el.tags?.website ?? el.tags?.['contact:website'],
          openingHours: el.tags?.opening_hours,
          operator: el.tags?.operator,
        };
        return item;
      })
      .filter((x): x is NearbyInfrastructure => x !== null);

    // Deduplicate: skip items within 80m of a closer same-type item
    const deduped: NearbyInfrastructure[] = [];
    for (const item of mapped.sort((a, b) => a.distanceMetres - b.distanceMetres)) {
      const tooClose = deduped.some(d =>
        d.type === item.type &&
        this.haversineMetres(d.lat, d.lng, item.lat, item.lng) < 80
      );
      if (!tooClose) deduped.push(item);
    }

    // Per-type cap: 3 for T1, 2 for T2
    const countByType = new Map<string, number>();
    const capped = deduped.filter(item => {
      const max = item.tier === 1 ? 3 : 2;
      const count = countByType.get(item.type) ?? 0;
      if (count >= max) return false;
      countByType.set(item.type, count + 1);
      return true;
    });

    // Global cap: 15 total (Tier 1 first)
    const sorted = capped.sort((a, b) => a.tier - b.tier || a.distanceMetres - b.distanceMetres);
    return sorted.slice(0, 15);
  }

  private buildReason(amenity: string, dist: number, incidentType: string, tier: 1 | 2 | 3): string {
    const label = TYPE_LABEL[amenity] ?? amenity.replace(/_/g, ' ');
    const distStr = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
    if (tier === 1) return `Critical response resource · ${distStr} from incident`;
    if (tier === 2) return `Supporting ${incidentType} response · ${distStr}`;
    return `Relevant infrastructure · ${distStr}`;
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
  lat?: number; lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
