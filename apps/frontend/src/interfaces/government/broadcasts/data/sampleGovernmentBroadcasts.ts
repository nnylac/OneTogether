import type { GovernmentBroadcast } from '../types/broadcast'

export const sampleGovernmentBroadcasts: GovernmentBroadcast[] = [
  {
    id: 'broadcast-001',
    title: 'Flood Alert - Orchard Area',
    message:
      'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.',
    audience: 'Zone',
    zone: 'Central',
    severity: 'critical',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
  },
  {
    id: 'broadcast-002',
    title: 'All Responders - Standby',
    message:
      'Multiple incidents reported across CBD. All units on standby for immediate deployment.',
    audience: 'Responders',
    responderOrganisationIds: ['spf', 'scdf'],
    responderOrganisationNames: ['SPF', 'SCDF'],
    severity: 'warning',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
  },
  {
    id: 'broadcast-003',
    title: 'Public Safety Advisory',
    message:
      'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.',
    audience: 'Public',
    severity: 'advisory',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
  },
  {
    id: 'broadcast-004',
    title: 'MRT Disruption Notice',
    message:
      'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.',
    audience: 'Public',
    severity: 'info',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
  },
  {
    id: 'broadcast-005',
    title: 'Volunteer Call - Medical Support',
    message:
      'Multiple medical incidents requiring first aid support. Certified volunteers should report to nearest SCDF station.',
    audience: 'Responders',
    responderOrganisationIds: ['scdf'],
    responderOrganisationNames: ['SCDF'],
    severity: 'warning',
    authorName: 'Chen Xiao Ling',
    createdAt: '20 May 2026, 01:50 pm',
  },
]
