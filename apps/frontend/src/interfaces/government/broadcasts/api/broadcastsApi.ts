import { fetchOrganisations } from '../../../responder/incidents/api/incidentsApi'
import type {
  BroadcastAudience,
  BroadcastSeverity,
  BroadcastZone,
  GovernmentBroadcast,
  NewBroadcastInput,
} from '../types/broadcast'

export type BroadcastAudienceApiDto = {
  id?: string
  audienceType: 'public' | 'role' | 'organisation' | 'region'
  audienceRole?: string | null
  organisationId?: string | null
  region?: string | null
}

export type CreateBroadcastApiDto = {
  title: string
  message: string
  broadcastType: string
  severity: string
  createdByUserId?: string
  audiences: BroadcastAudienceApiDto[]
}

export type BroadcastApiDto = {
  id: string
  title: string
  message: string
  broadcastType: string
  severity: string
  status: string
  createdByUserId: string | null
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  audiences: BroadcastAudienceApiDto[]
}

export function mapNewBroadcastToCreateBroadcastDto(
  broadcast: NewBroadcastInput,
  createdByUserId?: string,
): CreateBroadcastApiDto {
  return {
    title: broadcast.title,
    message: broadcast.message,
    broadcastType: 'emergency_advisory',
    severity: broadcast.severity,
    createdByUserId,
    audiences: mapBroadcastAudiences(broadcast),
  }
}

export async function fetchGovernmentBroadcasts(): Promise<GovernmentBroadcast[]> {
  const [broadcasts, organisations] = await Promise.all([
    fetchBroadcasts(),
    fetchOrganisations(),
  ])
  const organisationNamesById = new Map(
    organisations.map((organisation) => [organisation.id, organisation.orgName]),
  )

  return broadcasts.map((broadcast) =>
    mapBroadcastFromApi(broadcast, organisationNamesById),
  )
}

export async function publishNewBroadcast(
  broadcast: NewBroadcastInput,
  createdByUserId?: string,
): Promise<GovernmentBroadcast> {
  const response = await fetch('/api/broadcasts', {
    body: JSON.stringify(
      mapNewBroadcastToCreateBroadcastDto(broadcast, createdByUserId),
    ),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to create broadcast')
  }

  const draft = (await response.json()) as BroadcastApiDto
  const publishResponse = await fetch(`/api/broadcasts/${draft.id}/publish`, {
    method: 'PATCH',
  })

  if (!publishResponse.ok) {
    throw new Error('Unable to publish broadcast')
  }

  const publishedBroadcast = (await publishResponse.json()) as BroadcastApiDto

  return mapBroadcastFromApi(
    publishedBroadcast,
    new Map(
      broadcast.responderOrganisationIds.map((organisationId, index) => [
        organisationId,
        broadcast.responderOrganisationNames[index] ?? 'Responder',
      ]),
    ),
  )
}

export async function archiveBroadcast(broadcastId: string) {
  const response = await fetch(`/api/broadcasts/${broadcastId}/archive`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    throw new Error('Unable to archive broadcast')
  }
}

async function fetchBroadcasts(): Promise<BroadcastApiDto[]> {
  const response = await fetch('/api/broadcasts?status=published')

  if (!response.ok) {
    throw new Error('Unable to load broadcasts')
  }

  return (await response.json()) as BroadcastApiDto[]
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

function mapBroadcastFromApi(
  broadcast: BroadcastApiDto,
  organisationNamesById: Map<string, string>,
): GovernmentBroadcast {
  const regionAudience = broadcast.audiences.find(
    (audience) => audience.audienceType === 'region',
  )
  const publicAudience = broadcast.audiences.find(
    (audience) => audience.audienceType === 'public',
  )
  const organisationAudiences = broadcast.audiences.filter(
    (audience) => audience.audienceType === 'organisation',
  )
  const audience: BroadcastAudience = regionAudience
    ? 'Zone'
    : publicAudience
      ? 'Public'
      : 'Responders'
  const responderOrganisationIds = organisationAudiences
    .map((audience) => audience.organisationId)
    .filter((organisationId): organisationId is string => Boolean(organisationId))

  return {
    id: broadcast.id,
    title: broadcast.title,
    message: broadcast.message,
    audience,
    zone:
      audience === 'Zone'
        ? toBroadcastZone(regionAudience?.region)
        : undefined,
    responderOrganisationIds:
      audience === 'Responders' ? responderOrganisationIds : undefined,
    responderOrganisationNames:
      audience === 'Responders'
        ? responderOrganisationIds.map(
            (organisationId) =>
              organisationNamesById.get(organisationId) ?? 'Responder',
          )
        : undefined,
    severity: toBroadcastSeverity(broadcast.severity),
    authorName: 'OneTogether',
    createdAt: formatBroadcastDate(broadcast.publishedAt ?? broadcast.createdAt),
  }
}

function toBroadcastSeverity(severity: string): BroadcastSeverity {
  if (
    severity === 'info' ||
    severity === 'advisory' ||
    severity === 'warning' ||
    severity === 'critical'
  ) {
    return severity
  }

  return 'info'
}

function toBroadcastZone(region: string | null | undefined): BroadcastZone {
  if (
    region === 'Nationwide' ||
    region === 'Central' ||
    region === 'East' ||
    region === 'West' ||
    region === 'North' ||
    region === 'South'
  ) {
    return region
  }

  return 'Nationwide'
}

function formatBroadcastDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
