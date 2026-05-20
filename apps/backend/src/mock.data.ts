export const db = {
  users: [
    { id: 'u-citizen', name: 'Amira Tan', email: 'citizen@onetogether.sg', role: 'citizen' },
    { id: 'u-org', name: 'Chen Xiao Ling', email: 'scdf@onetogether.sg', role: 'organisation', organisationId: 'scdf' },
    { id: 'u-gov', name: 'Raj Kumar', email: 'raj.kumar@gov.sg', role: 'government' }
  ],
  organisations: [
    { id: 'scdf', name: 'Singapore Civil Defence Force', type: 'Government' },
    { id: 'spf', name: 'Singapore Police Force', type: 'Government' },
    { id: 'redcross', name: 'Singapore Red Cross', type: 'NGO' }
  ],
  incidents: [
    { id: 'INC-2026-0520', title: 'Flooding at Orchard Road', type: 'Flood', severity: 'Critical', status: 'In Progress', createdBy: 'scdf', publicVisibility: 'Public', assignedOrganisations: ['scdf', 'spf', 'redcross'] },
    { id: 'INC-2026-0521', title: 'Construction Site Injury', type: 'Medical', severity: 'High', status: 'Dispatched', createdBy: 'sgh', publicVisibility: 'Private', assignedOrganisations: ['sgh', 'scdf'] }
  ],
  broadcasts: [
    { id: 'b1', title: 'Flood Alert - Orchard Area', audience: 'zone', severity: 'CRITICAL', zone: 'Central', message: 'Heavy rainfall causing flash floods.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm' }
  ],
  hospitals: [
    { id: 'h1', name: 'Alexandra Hospital', availableBeds: 89, totalBeds: 330, icuAvailable: 6 },
    { id: 'h2', name: 'Changi General Hospital', availableBeds: 134, totalBeds: 1000, icuAvailable: 11 }
  ],
  volunteerTasks: [
    { id: 'vt1', title: 'Flood Relief - Emergency Food Packing', organisation: 'Singapore Red Cross', slotsFilled: 18, slotsTotal: 30, urgency: 'High' }
  ],
  communityProgrammes: [
    { id: 'cp1', title: 'Community Emergency Preparedness Workshop', organisation: 'Jurong West RC', registered: 38, capacity: 60 }
  ],
  thresholds: [
    { id: 't1', title: 'Open incidents threshold', current: 13, threshold: 10, status: 'Warning' }
  ],
  notifications: [
    { id: 'n1', text: 'Flooding at Orchard Road assigned to your organisation', time: '2 min ago' }
  ]
};
