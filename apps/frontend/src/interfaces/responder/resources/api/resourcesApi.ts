export type ResourceStatus = 'healthy' | 'strained' | 'critical'

export type ResourceTotals = {
  total: number
  available: number
  deployed: number
  reserved: number
  maintenance: number
}

export type ResourceItem = ResourceTotals & {
  id: string
  externalResourceId: string
  name: string
  category: string
  unit: string
  status: ResourceStatus
  lastSyncedAt: string
}

export type ResourceOutlet = {
  id: string
  agencyId: string
  externalOutletId: string
  name: string
  type: string
  region: string | null
  address: string | null
  sourceSystemId: string
  lastSyncedAt: string
  totals: ResourceTotals
  status: ResourceStatus
  resources: ResourceItem[]
}

export type ResourceSummaryGroup = {
  key: string
  totals: ResourceTotals
  status: ResourceStatus
}

export type ResourceSummary = {
  lastSyncedAt: string | null
  totals: ResourceTotals
  byAgency: ResourceSummaryGroup[]
  byCategory: ResourceSummaryGroup[]
  criticalOutlets: ResourceOutlet[]
}

export type ResourceFilters = {
  agencyId?: string
  outletType?: string
  region?: string
  resourceCategory?: string
}

export async function fetchResourceSummary(filters: ResourceFilters = {}) {
  const response = await fetch(`/api/resources/summary${toQueryString(filters)}`)

  if (!response.ok) {
    throw new Error('Unable to load resource summary')
  }

  return (await response.json()) as ResourceSummary
}

export async function fetchResourceOutlets(filters: ResourceFilters = {}) {
  const response = await fetch(`/api/resources/outlets${toQueryString(filters)}`)

  if (!response.ok) {
    throw new Error('Unable to load resource outlets')
  }

  return (await response.json()) as ResourceOutlet[]
}

export async function syncResources() {
  const response = await fetch('/api/resources/sync', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to sync resources')
  }

  return response.json()
}

function toQueryString(filters: ResourceFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}
