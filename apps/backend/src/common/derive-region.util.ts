export const REGIONS = [
  'Central',
  'East',
  'West',
  'North',
  'North-East',
  'Unknown',
] as const;

export type Region = (typeof REGIONS)[number];

type RegionSource = {
  latitude: { toString(): string } | number | null;
  longitude: { toString(): string } | number | null;
  inc_location: string | null;
};

/**
 * Maps an incident to a Singapore region, first by coordinates and then by
 * well-known place names in the free-text location. Shared by analytics
 * grouping and AI broadcast grounding.
 */
export function deriveRegion(incident: RegionSource): Region {
  if (incident.latitude !== null && incident.longitude !== null) {
    const latitude = Number(incident.latitude);
    const longitude = Number(incident.longitude);

    if (latitude >= 1.39 && longitude < 103.87) return 'North';
    if (latitude >= 1.35 && longitude >= 103.87) return 'North-East';
    if (longitude >= 103.89) return 'East';
    if (longitude <= 103.77) return 'West';
    if (
      latitude >= 1.25 &&
      latitude <= 1.39 &&
      longitude >= 103.77 &&
      longitude < 103.89
    ) {
      return 'Central';
    }
  }

  const location = incident.inc_location?.toLowerCase() ?? '';
  const textRegions: Array<[Region, string[]]> = [
    [
      'North-East',
      ['sengkang', 'punggol', 'hougang', 'serangoon', 'buangkok'],
    ],
    ['North', ['woodlands', 'sembawang', 'yishun', 'mandai']],
    ['East', ['bedok', 'tampines', 'pasir ris', 'changi', 'paya lebar']],
    ['West', ['jurong', 'clementi', 'bukit batok', 'choa chu kang', 'tuas']],
    [
      'Central',
      ['orchard', 'marina', 'downtown', 'toa payoh', 'bishan', 'novena'],
    ],
  ];
  return (
    textRegions.find(([, keywords]) =>
      keywords.some((keyword) => location.includes(keyword)),
    )?.[0] ?? 'Unknown'
  );
}
