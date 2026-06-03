import type { IncidentResource } from '../types'

export const incidentResources: IncidentResource[] = [
  {
    id: 'resource-001',
    unit: 'SCDF-AMB-01',
    agency: 'SCDF',
    type: 'Ambulance',
    assignedAt: '20 May 2026, 01:43 pm',
    status: 'on scene',
    notes: 'Primary medical response unit',
  },
  {
    id: 'resource-002',
    unit: 'SGH-MT-01',
    agency: 'MOH',
    type: 'Medical Team',
    assignedAt: '20 May 2026, 01:45 pm',
    status: 'engaged',
    notes: 'Receiving team notified',
  },
  {
    id: 'resource-003',
    unit: 'SPF-CORDON-02',
    agency: 'SPF',
    type: 'Police Response',
    assignedAt: '20 May 2026, 01:46 pm',
    status: 'dispatched',
    notes: 'Crowd control and access lane support',
  },
]
