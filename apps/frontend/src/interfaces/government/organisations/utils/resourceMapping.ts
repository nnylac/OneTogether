import type {
  ResourceItem,
  ResourceOutlet,
} from '../../../responder/resources/api/resourcesApi'
import type { Hospital } from '../types/organisation'
import { getHospitalCapacityStatus } from './hospitalCapacity'

export function mapResourceOutletsToHospitals(
  outlets: ResourceOutlet[],
): Hospital[] {
  return outlets
    .filter(isHospitalOutlet)
    .map((outlet) => {
      const bedResource = findResource(outlet.resources, ['bed', 'ward'])
      const icuResource = findResource(outlet.resources, ['icu'])
      const traumaResource = findResource(outlet.resources, ['trauma'])

      const availableBeds = bedResource?.available ?? outlet.totals.available
      const totalBeds = bedResource?.total ?? outlet.totals.total

      return {
        id: outlet.id,
        name: outlet.name,
        address: outlet.address ?? outlet.region ?? 'Address unavailable',
        availableBeds,
        totalBeds,
        icuAvailable:
          icuResource?.available ??
          Math.max(0, Math.round(availableBeds * 0.08)),
        traumaBays:
          traumaResource?.available ??
          Math.max(0, Math.round(availableBeds * 0.03)),
        status: getHospitalCapacityStatus(availableBeds, totalBeds),
        lastUpdatedAt: outlet.lastSyncedAt,
      }
    })
}

function isHospitalOutlet(outlet: ResourceOutlet) {
  const haystack = [
    outlet.name,
    outlet.type,
    outlet.agencyId,
    outlet.sourceSystemId,
    ...outlet.resources.map((resource) => resource.category),
    ...outlet.resources.map((resource) => resource.name),
  ]
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('hospital') ||
    haystack.includes('healthcare') ||
    haystack.includes('medical') ||
    haystack.includes('moh') ||
    haystack.includes('sgh')
  )
}

function findResource(resources: ResourceItem[], keywords: string[]) {
  return resources.find((resource) => {
    const haystack = `${resource.name} ${resource.category}`.toLowerCase()

    return keywords.some((keyword) => haystack.includes(keyword))
  })
}