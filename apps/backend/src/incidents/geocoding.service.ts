import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number; queriedAs: string } | null> {
    const queries = this.buildQueries(address);

    for (let i = 0; i < queries.length; i++) {
      if (i > 0) await this.sleep(300); // respect Nominatim 1 req/sec limit
      const result = await this.tryQuery(queries[i]);
      if (result) {
        this.logger.log(`Geocoded "${address}" via "${queries[i]}" → ${result.lat}, ${result.lng}`);
        return { ...result, queriedAs: queries[i] };
      }
    }

    this.logger.warn(`Geocoding exhausted all queries for "${address}"`);
    return null;
  }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  private buildQueries(address: string): string[] {
    const queries: string[] = [];
    const sg = ', Singapore';

    // 1. Exact + Singapore
    queries.push(`${address}${sg}`);

    // 2. Strip Singapore-specific sub-location suffixes
    const stripped = address
      .replace(/\s*,?\s*exit\s+[a-z0-9]+/gi, '')       // Exit A, Exit B, Exit 1
      .replace(/\s*,?\s*platform\s+[a-z0-9]*/gi, '')    // Platform B
      .replace(/\s*,?\s*concourse/gi, '')                // Concourse
      .replace(/\s*,?\s*level\s+[b\d]\d*/gi, '')        // Level B1, Level 2
      .replace(/\s*,?\s*b\d+/gi, '')                    // B1, B2 (basement)
      .replace(/\s*,?\s*l\d+/gi, '')                    // L1, L2 (level)
      .replace(/\s*,?\s*#[\w-]+/gi, '')                 // #02-15 unit numbers
      .replace(/\s*,?\s*blk\s+\d+[a-z]?/gi, '')        // Blk 123A
      .replace(/\s*,?\s*lot\s+[\w-]+/gi, '')            // Lot C3
      .trim();

    if (stripped && stripped !== address) {
      queries.push(`${stripped}${sg}`);
    }

    // 3. First comma-separated segment only
    const firstSegment = address.split(',')[0].trim();
    if (firstSegment !== address && firstSegment !== stripped) {
      queries.push(`${firstSegment}${sg}`);
    }

    // 4. Strip directional/exit words from the first segment
    const coreName = firstSegment
      .replace(/\s+(exit|entrance|gate|terminal|wing)\s*[a-z0-9]*/gi, '')
      .replace(/\s+(north|south|east|west|upper|lower)\s+/gi, ' ')
      .trim();
    if (coreName && coreName !== firstSegment && coreName.length > 3) {
      queries.push(`${coreName}${sg}`);
    }

    // 5. Extract capitalised words (likely a proper noun / landmark name)
    const capitals = firstSegment.match(/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b/g);
    if (capitals && capitals.length > 0) {
      const landmark = capitals[0];
      if (landmark !== coreName && landmark !== firstSegment && landmark.length > 3) {
        queries.push(`${landmark}${sg}`);
      }
    }

    return [...new Set(queries)]; // deduplicate
  }

  private async tryQuery(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // bounded=1 + viewbox constrains to Singapore bounding box
      const params = new URLSearchParams({
        q: query,
        countrycodes: 'sg',
        format: 'json',
        limit: '1',
        viewbox: '103.60,1.16,104.00,1.48',
        bounded: '1',
      });
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'OneTogether-EmergencyPlatform/1.0' },
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim HTTP ${res.status} for "${query}"`);
        return null;
      }
      const data = await res.json() as { lat: string; lon: string }[];
      if (!data.length) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
      this.logger.warn(`Nominatim fetch failed for "${query}": ${String(err)}`);
      return null;
    }
  }
}
