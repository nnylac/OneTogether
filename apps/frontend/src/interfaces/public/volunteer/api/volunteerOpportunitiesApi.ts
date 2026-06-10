export type VolunteerSource = {
  id: string
  sourceName: string
  sourceUrl: string
  organisationId: string | null
  isActive: boolean
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

export type VolunteerOpportunity = {
  id: string
  sourceId: string
  externalId: string
  title: string
  description: string | null
  opportunityType: string | null
  urgency: 'normal' | 'urgent' | 'critical'
  location: string | null
  region: string | null
  startAt: string | null
  endAt: string | null
  slotsTotal: number | null
  slotsFilled: number
  slotsLeft: number | null
  slotProgress: number | null
  requiresTraining: boolean
  signupUrl: string
  sourceUrl: string | null
  externalUpdatedAt: string | null
  status: string
  createdAt: string
  updatedAt: string
  source: VolunteerSource
}

export async function fetchVolunteerOpportunities(): Promise<
  VolunteerOpportunity[]
> {
  const response = await fetch('/api/volunteer-opportunities')

  if (!response.ok) {
    throw new Error('Unable to load volunteer opportunities')
  }

  return (await response.json()) as VolunteerOpportunity[]
}
