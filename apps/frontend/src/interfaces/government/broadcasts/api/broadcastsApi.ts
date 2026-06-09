import type { NewBroadcastInput } from '../types/broadcast'

export type BroadcastAudienceApiDto = {
  audienceType: 'public' | 'role' | 'organisation' | 'region'
  audienceRole?: string
  organisationId?: string
  region?: string
}

export type CreateBroadcastApiDto = {
  title: string
  message: string
  broadcastType: string
  severity: string
  audiences: BroadcastAudienceApiDto[]
}

export function mapNewBroadcastToCreateBroadcastDto(
  broadcast: NewBroadcastInput,
): CreateBroadcastApiDto {
  return {
    title: broadcast.title,
    message: broadcast.message,
    broadcastType: 'emergency_advisory',
    severity: broadcast.severity,
    audiences: mapBroadcastAudiences(broadcast),
  }
}

export async function createBroadcast(broadcast: NewBroadcastInput) {
  const response = await fetch('/api/broadcasts', {
    body: JSON.stringify(mapNewBroadcastToCreateBroadcastDto(broadcast)),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to create broadcast')
  }

  return response.json()
}

function mapBroadcastAudiences(
  broadcast: NewBroadcastInput,
): BroadcastAudienceApiDto[] {
  if (broadcast.audience === 'Public') {
    return [{ audienceType: 'public' }]
  }

  if (broadcast.audience === 'Responders') {
    return broadcast.responderOrganisationIds.map((organisationId) => ({
      audienceType: 'organisation',
      organisationId,
    }))
  }

  return [
    {
      audienceType: 'region',
      region: broadcast.zone,
    },
  ]
}
