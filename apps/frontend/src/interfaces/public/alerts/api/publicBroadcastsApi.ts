import { samplePublicAlerts } from '../data/samplePublicAlerts'
import type { PublicAlert, PublicAlertSeverity } from '../types/alert'

type BroadcastAudienceApiDto = {
  id: string
  audienceType: 'public' | 'role' | 'organisation' | 'region'
  audienceRole: string | null
  organisationId: string | null
  region: string | null
}

type BroadcastApiDto = {
  id: string
  title: string
  message: string
  severity: string
  status: string
  createdAt: string
  updatedAt: string
  audiences: BroadcastAudienceApiDto[]
}

const allowedSeverities = new Set<PublicAlertSeverity>([
  'info',
  'advisory',
  'warning',
  'critical',
])

export async function fetchPublicAlerts(): Promise<PublicAlert[]> {
  const response = await fetch('/api/broadcasts?status=published')

  if (!response.ok) {
    throw new Error('Unable to load broadcasts')
  }

  const broadcasts = (await response.json()) as BroadcastApiDto[]

  return broadcasts.flatMap(mapBroadcastToPublicAlerts)
}

function mapBroadcastToPublicAlerts(broadcast: BroadcastApiDto): PublicAlert[] {
  const publicAudiences = broadcast.audiences.filter(
    (audience) =>
      audience.audienceType === 'public' || audience.audienceType === 'region',
  )

  return publicAudiences.map((audience) => ({
    id: `${broadcast.id}-${audience.id ?? audience.audienceType}`,
    title: broadcast.title,
    message: broadcast.message,
    audience: audience.audienceType === 'region' ? 'Zone' : 'Public',
    zone: audience.region ?? undefined,
    severity: toSeverity(broadcast.severity),
    authorName: 'OneTogether',
    createdAt: formatBroadcastDate(broadcast.createdAt),
    recommendations: getRecommendations(broadcast.title, broadcast.severity),
  }))
}

function toSeverity(severity: string): PublicAlertSeverity {
  return allowedSeverities.has(severity as PublicAlertSeverity)
    ? (severity as PublicAlertSeverity)
    : 'info'
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

function getRecommendations(title: string, severity: string) {
  // TODO: Replace these frontend fallback recommendations when broadcasts expose
  // structured public safety steps from the backend.
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('flood')) {
    return samplePublicAlerts[0].recommendations
  }

  if (normalizedTitle.includes('mrt') || normalizedTitle.includes('train')) {
    return samplePublicAlerts[2].recommendations
  }

  if (severity === 'critical') {
    return [
      {
        title: 'Move away from immediate danger',
        body: 'Leave the affected area if it is safe to do so and follow instructions from emergency personnel.',
      },
      {
        title: 'Call emergency services for life-threatening danger',
        body: 'Call 995 for fire or ambulance emergencies, or 999 for police assistance.',
      },
      {
        title: 'Keep routes clear',
        body: 'Avoid the area so responders can reach people who need help.',
      },
    ]
  }

  return samplePublicAlerts[1].recommendations
}
