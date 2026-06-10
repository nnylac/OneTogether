import type { PublicAlert } from '../types/alert'

export const samplePublicAlerts: PublicAlert[] = [
  {
    id: 'public-alert-001',
    title: 'Flood Alert - Orchard Area',
    message:
      'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.',
    audience: 'Zone',
    zone: 'Central',
    severity: 'critical',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
    recommendations: [
      {
        title: 'Move to higher ground immediately',
        body: 'If you are in a low-lying area, move to a higher floor or higher terrain. Do not wait for water to enter your home.',
      },
      {
        title: 'Do not enter floodwater',
        body: 'Moving water can knock adults off their feet and sweep vehicles away. Stay out of floodwater.',
      },
      {
        title: 'Avoid underpasses, canals and low-lying roads',
        body: 'These routes can fill quickly. Do not drive or walk through submerged roads.',
      },
      {
        title: 'Switch off electricity at the mains',
        body: 'If water is entering your home, turn off the electrical mains switch when it is safe to do so.',
      },
    ],
  },
  {
    id: 'public-alert-002',
    title: 'Public Safety Advisory',
    message:
      'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.',
    audience: 'Public',
    severity: 'advisory',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
    recommendations: [
      {
        title: 'Avoid the affected area',
        body: 'Use alternative routes and follow directions from officers on site.',
      },
      {
        title: 'Keep access clear for responders',
        body: 'Do not stop near emergency vehicles or restricted work zones.',
      },
      {
        title: 'Watch for official updates',
        body: 'Check this page again before travelling through Marina Bay.',
      },
    ],
  },
  {
    id: 'public-alert-003',
    title: 'MRT Disruption Notice',
    message:
      'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.',
    audience: 'Public',
    severity: 'info',
    authorName: 'Raj Kumar',
    createdAt: '20 May 2026, 01:50 pm',
    recommendations: [
      {
        title: 'Plan extra travel time',
        body: 'Use alternative bus services where available and expect crowding near affected stations.',
      },
      {
        title: 'Check official transport channels',
        body: 'Confirm service status before starting your trip.',
      },
    ],
  },
]
