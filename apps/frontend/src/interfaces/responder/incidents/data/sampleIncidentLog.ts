import type { Incident, IncidentLogEntry, IncidentResource } from '../types'

export function createIncidentLogEntries(
  incident: Incident,
  resources: IncidentResource[],
): IncidentLogEntry[] {
  const primaryResource = resources[0]
  const medicalResource = resources.find((resource) => resource.type === 'Medical Team')
  const supportResource = resources.find((resource) => resource.agency === 'SPF')
  const reportedTime = getTime(incident.createdAt ?? incident.date)
  const updatedTime = getTime(incident.updatedAt ?? incident.date)

  return [
    {
      id: 'log-006',
      category: 'note',
      source: 'System',
      author: incident.incidentCommander ?? 'Chen Xiao Ling',
      body: `Status currently recorded as ${incident.status}.`,
      time: updatedTime,
    },
    {
      id: 'log-005',
      category: 'note',
      source: 'System',
      author: incident.incidentCommander ?? 'Chen Xiao Ling',
      body: `${incident.incidentCommander ?? 'Chen Xiao Ling'} joined the incident room.`,
      time: reportedTime,
    },
    {
      id: 'log-004',
      category: 'medical',
      source: medicalResource?.agency ?? 'MOH',
      author: medicalResource?.unit ?? 'Medical Team',
      body: `${medicalResource?.unit ?? 'Medical team'} engaged for patient handover and receiving care coordination.`,
      time: getTime(medicalResource?.assignedAt ?? incident.date),
    },
    {
      id: 'log-003',
      category: 'deploy',
      source: supportResource?.agency ?? primaryResource?.agency ?? 'SCDF',
      author: supportResource?.unit ?? primaryResource?.unit ?? 'Response Unit',
      body: `${supportResource?.unit ?? primaryResource?.unit ?? 'Response unit'} assigned to ${incident.location}.`,
      time: getTime(supportResource?.assignedAt ?? primaryResource?.assignedAt ?? incident.date),
    },
    {
      id: 'log-002',
      category: 'status',
      source: primaryResource?.agency ?? 'SCDF',
      author: incident.incidentCommander ?? 'Chen Xiao Ling',
      body: `Incident verified. Confidence ${incident.confidenceScore ?? 0}%. Status advanced to ${incident.status}.`,
      time: updatedTime,
    },
    {
      id: 'log-001',
      category: 'initial',
      source: primaryResource?.agency ?? 'SCDF',
      author: incident.incidentCommander ?? 'Chen Xiao Ling',
      body: `Case opened from 995 dispatch feed for ${incident.location}. ${incident.description}`,
      time: reportedTime,
    },
  ]
}

function getTime(dateTime: string) {
  return dateTime.split(', ').at(-1) ?? dateTime
}
