import type { IncidentLogEntry } from '../types'

export const incidentLogEntries: IncidentLogEntry[] = [
  {
    id: 'log-006',
    category: 'note',
    source: 'System',
    author: 'Chen Xiao Ling',
    body: 'Status updated to Contained by Chen Xiao Ling.',
    time: '05:20 pm',
  },
  {
    id: 'log-005',
    category: 'note',
    source: 'System',
    author: 'Chen Xiao Ling',
    body: 'Chen Xiao Ling joined the incident room.',
    time: '05:20 pm',
  },
  {
    id: 'log-004',
    category: 'medical',
    source: 'SCDF',
    author: 'SSI Rahman',
    body: 'Paramedic team on scene. AED shock administered x2. ROSC achieved. Patient stabilised for transport to SGH.',
    time: '04:58 pm',
  },
  {
    id: 'log-003',
    category: 'deploy',
    source: 'SCDF',
    author: 'SCDF-AMB-01 Crew',
    body: 'SCDF-AMB-01 arrived Orchard MRT Exit B. Patient unconscious, CPR in progress by station staff.',
    time: '04:58 pm',
  },
  {
    id: 'log-002',
    category: 'status',
    source: 'SCDF',
    author: 'Chen Xiao Ling',
    body: 'Incident verified. Confidence 95%. Status advanced to Verified.',
    time: '04:58 pm',
  },
  {
    id: 'log-001',
    category: 'initial',
    source: 'SCDF',
    author: 'Chen Xiao Ling',
    body: 'Case opened from 995 dispatch feed. AED deployed by station staff confirmed.',
    time: '04:58 pm',
  },
]
