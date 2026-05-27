import type { Broadcast, CommunityProgramme, Hospital, Incident, NotificationItem, Organisation, ThresholdAlert, User, VolunteerTask } from '../types';

export const users: User[] = [
  { id: 'u-citizen', name: 'Amira Tan', email: 'citizen@onetogether.sg', role: 'citizen' },
  { id: 'u-org', name: 'Chen Xiao Ling', email: 'scdf@onetogether.sg', role: 'organisation', organisationId: 'scdf' },
  { id: 'u-gov', name: 'Raj Kumar', email: 'raj.kumar@gov.sg', role: 'government' }
];

export const organisations: Organisation[] = [
  { id: 'scdf', name: 'Singapore Civil Defence Force', type: 'Government', address: 'Buona Vista Fire Station, 51 Buona Vista Rd', verified: true, volunteersAvailable: 18, volunteersTotal: 25, activeTasks: 0, status: 'active' },
  { id: 'sgh', name: 'Singapore General Hospital', type: 'Healthcare', address: 'Outram Rd', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'active' },
  { id: 'redcross', name: 'Singapore Red Cross - Jurong Chapter', type: 'NGO', address: 'Jurong West Sports Centre, 20 Jurong West St 93', verified: true, volunteersAvailable: 32, volunteersTotal: 48, activeTasks: 2, status: 'deployed' },
  { id: 'pa-jurong', name: "People's Association - Jurong West Volunteers", type: 'Grassroots', address: 'Jurong West Community Club, 20 Jurong West St 61', verified: true, volunteersAvailable: 85, volunteersTotal: 120, activeTasks: 1, status: 'active' },
  { id: 'stjohn', name: 'St John Ambulance Brigade - Jurong Unit', type: 'Healthcare', address: 'Jurong East MRT Station', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'active' },
  { id: 'tampines-cc', name: 'Tampines North Community Club - CARE Network', type: 'Grassroots', address: '10 Tampines St 91', verified: true, volunteersAvailable: 60, volunteersTotal: 95, activeTasks: 0, status: 'active' },
  { id: 'hsa', name: 'Health Sciences Authority', type: 'Government', address: '11 Outram Rd', verified: true, volunteersAvailable: 78, volunteersTotal: 245, activeTasks: 1, status: 'active' }
];

export const incidents: Incident[] = [
  { id: 'INC-2026-0519', title: 'Cardiac Arrest at MRT', type: 'Medical', severity: 'Critical', status: 'Open', createdBy: 'scdf', createdAt: '20 May 2026, 01:42 pm', location: 'Orchard MRT Exit B', zone: 'Central', description: 'Unconscious commuter. AED deployed by station staff.', assignedOrganisations: ['scdf', 'sgh'], respondingOrganisations: [{ organisation: 'SCDF', status: 'Dispatched' }, { organisation: 'Hospital', status: 'Awaiting patient' }], volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 2, volunteersResponded: 0, timeline: [{ id: 'tl-0519-1', timestamp: '20 May 2026, 13:42', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Case opened from 995 dispatch feed. AED deployed by station staff confirmed.' }] },
  { id: 'INC-2026-0520', title: 'Flooding at Orchard Road', type: 'Flood', severity: 'Critical', status: 'In Progress', createdBy: 'scdf', createdAt: '20 May 2026, 01:50 pm', location: 'Orchard Road / Scotts Road', zone: 'Central', description: 'Flash flooding affecting pedestrian underpasses and low-lying roads.', assignedOrganisations: ['scdf', 'spf', 'redcross'], respondingOrganisations: [{ organisation: 'SCDF', status: 'Dispatched' }, { organisation: 'SPF', status: 'On Scene' }, { organisation: 'Singapore Red Cross', status: 'Volunteer support requested' }], volunteerSupportNeeded: true, publicVisibility: 'Public', unitsResponded: 7, volunteersResponded: 14, timeline: [
      { id: 'tl-0520-1', timestamp: '20 May 2026, 13:50', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Flash flooding reported at Orchard Road / Scotts Road underpass. Multiple 995 calls received.' },
      { id: 'tl-0520-2', timestamp: '20 May 2026, 13:52', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'DEPLOY', text: 'Pumping team and 3 flood response units dispatched to affected area.' },
      { id: 'tl-0520-3', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory issued. Residents advised to avoid low-lying areas in Orchard zone.' },
      { id: 'tl-0520-4', timestamp: '20 May 2026, 14:04', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'Traffic diversion activated at Scotts Road junction. Lane closures in effect.' }
    ] },
  { id: 'INC-2026-0521', title: 'Construction Site Injury', type: 'Medical', severity: 'High', status: 'Dispatched', createdBy: 'sgh', createdAt: '20 May 2026, 01:36 pm', location: 'Marina Bay construction zone', zone: 'Central', description: 'Worker fall injury. Trauma bay notified.', assignedOrganisations: ['sgh', 'scdf'], respondingOrganisations: [{ organisation: 'SCDF', status: 'Dispatched' }, { organisation: 'Hospital', status: 'Trauma bay reserved' }], volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 1, volunteersResponded: 0, timeline: [{ id: 'tl-0521-1', timestamp: '20 May 2026, 13:36', organisation: 'SGH', actor: 'SGH Trauma Coordinator', category: 'INITIAL', text: 'Trauma ticket created via hospital source system. Worker fall from scaffolding. Trauma bay reserved.' }] },
  { id: 'INC-2026-0522', title: 'MRT Power Fault on North-South Line', type: 'Infrastructure', severity: 'High', status: 'Open', createdBy: 'spf', createdAt: '20 May 2026, 01:50 pm', location: 'North-South Line', zone: 'North', description: 'Power fault causing crowding and station closures.', assignedOrganisations: ['spf'], respondingOrganisations: [{ organisation: 'SPF', status: 'Crowd control monitoring' }], volunteerSupportNeeded: false, publicVisibility: 'Public', unitsResponded: 3, volunteersResponded: 0, timeline: [
      { id: 'tl-0522-1', timestamp: '20 May 2026, 13:50', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'Power fault on North-South Line confirmed. Station crowding reported at multiple stops.' },
      { id: 'tl-0522-2', timestamp: '20 May 2026, 13:53', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'Public transport disruption notice requested. SMRT briefed. Crowd control officers deployed to Bishan and Toa Payoh stations.' }
    ] }
];

export const broadcasts: Broadcast[] = [
  { id: 'b1', title: 'Flood Alert - Orchard Area', severity: 'CRITICAL', audience: 'zone', zone: 'Central', message: 'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'Waves', linkedIncidentId: 'INC-2026-0520' },
  { id: 'b2', title: 'All Responders - Standby', severity: 'NOTICE', audience: 'responders', message: 'Multiple incidents reported across CBD. All units on standby for immediate deployment.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'Radio' },
  { id: 'b3', title: 'Public Safety Advisory', severity: 'INFO', audience: 'all', message: 'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'ShieldAlert' },
  { id: 'b4', title: 'MRT Disruption Notice', severity: 'NOTICE', audience: 'all', message: 'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'Train' },
  { id: 'b5', title: 'Volunteer Call - Medical Support', severity: 'INFO', audience: 'responders', message: 'Multiple medical incidents requiring first aid support. Certified volunteers should report to nearest SCDF station.', issuer: 'Chen Xiao Ling', timestamp: '20 May 2026, 01:50 pm', icon: 'HeartPulse' }
];

export const volunteerTasks: VolunteerTask[] = [
  { id: 'vt1', title: 'Flood Relief - Emergency Food Packing', organisation: 'Singapore Red Cross', location: 'Jurong West Sports Centre', time: 'Today 10:00 AM - 2:00 PM', urgency: 'High', skills: ['Packing', 'Logistics', 'No prior experience'], slotsFilled: 18, slotsTotal: 30, status: 'Filling', description: 'Pack emergency ration kits for displaced residents at Jurong West evacuation centre.' },
  { id: 'vt2', title: 'Evacuation Centre - Registration Desk', organisation: 'SCDF Community Resilience', location: 'Clementi Community Club', time: 'Today 12:00 PM - 8:00 PM', urgency: 'Critical', skills: ['Registration', 'Crowd support'], slotsFilled: 4, slotsTotal: 10, status: 'Open', description: 'Assist residents with intake forms and queue guidance.' },
  { id: 'vt3', title: 'Language Support - Mandarin / Tamil', organisation: "People's Association", location: 'Multiple sites', time: 'Today - on call from 9 AM', urgency: 'High', skills: ['Mandarin', 'Tamil'], slotsFilled: 3, slotsTotal: 8, status: 'Open', description: 'Support multilingual guidance at community help desks.' },
  { id: 'vt4', title: 'First Aid Station Support', organisation: 'Singapore General Hospital', location: 'Jurong West Sports Centre - Medical Post B', time: 'Today 8:00 AM - 8:00 PM', urgency: 'Critical', skills: ['First Aid'], slotsFilled: 12, slotsTotal: 15, status: 'Filling', description: 'Support first aid station operations under medical supervision.' },
  { id: 'vt5', title: 'Emergency Supply Distribution', organisation: 'Singapore Civil Defence Force', location: 'Bukit Batok Community Centre', time: 'Tomorrow 9:00 AM - 5:00 PM', urgency: 'Medium', skills: ['Logistics'], slotsFilled: 7, slotsTotal: 20, status: 'Open', description: 'Distribute water, blankets, and emergency supplies.' },
  { id: 'vt6', title: 'Blood Donation Drive - Walk-in', organisation: 'Health Sciences Authority', location: 'HSA Bloodbank @ HSA, 11 Outram Rd', time: 'Today & Tomorrow 8:30 AM - 4:30 PM', urgency: 'High', skills: ['Walk-in'], slotsFilled: 143, slotsTotal: 200, status: 'Filling', description: 'Support increased blood donation intake and queue operations.' }
];

export const communityProgrammes: CommunityProgramme[] = [
  { id: 'cp1', title: 'Community Emergency Preparedness Workshop', organisation: 'Jurong West RC', location: 'Jurong West CC, Multi-Purpose Hall 1', time: 'Sat, 24 May - 9:00 AM - 12:00 PM', category: 'Preparedness', tags: ['First Aid', 'Preparedness', 'Free'], registered: 38, capacity: 60, description: 'Hands-on workshop covering first aid, evacuation readiness, and household emergency kits.', contact: 'jurongwest.rc@pa.gov.sg' },
  { id: 'cp2', title: 'Flood Relief Donation Drive', organisation: 'Singapore Red Cross', location: 'Clementi MRT Station Exit A', time: 'Today & Tomorrow - 9:00 AM - 9:00 PM', category: 'Relief', tags: ['Donations', 'Flood Relief', 'Walk-in'], registered: 94, capacity: 140, description: 'Collecting bottled water, ready-to-eat meals, hygiene kits, and blankets for affected families.', contact: 'relief@redcross.sg' },
  { id: 'cp3', title: 'Neighbourhood CPR and AED Training', organisation: 'St John Ambulance Brigade', location: 'Jurong East Community Hall', time: 'Sun, 25 May - 10:00 AM - 1:00 PM', category: 'Training', tags: ['CPR', 'AED', 'Certificate'], registered: 22, capacity: 40, description: 'Learn CPR fundamentals and how to use an AED during cardiac emergencies.', contact: 'training@stjohn.sg' },
  { id: 'cp4', title: 'Heat Safety Outreach Booth', organisation: "People's Association", location: 'Tampines Hub Atrium', time: 'Fri, 23 May - 11:00 AM - 5:00 PM', category: 'Awareness', tags: ['Heat Safety', 'Seniors', 'Free'], registered: 16, capacity: 50, description: 'Public outreach on heat injury prevention and checking in on vulnerable neighbours.', contact: 'care@pa.gov.sg' }
];

export const hospitals: Hospital[] = [
  { id: 'h1', name: 'Alexandra Hospital', address: '378 Alexandra Rd, Singapore 159964', availableBeds: 89, totalBeds: 330, icuAvailable: 6, traumaBays: 3, status: 'Limited', updatedAt: '01:50 pm' },
  { id: 'h2', name: 'Changi General Hospital', address: '2 Simei St 3, Singapore 529889', availableBeds: 134, totalBeds: 1000, icuAvailable: 11, traumaBays: 5, status: 'Limited', updatedAt: '01:50 pm' },
  { id: 'h3', name: 'Khoo Teck Puat Hospital', address: '90 Yishun Central, Singapore 768828', availableBeds: 112, totalBeds: 800, icuAvailable: 9, traumaBays: 4, status: 'Limited', updatedAt: '01:50 pm' },
  { id: 'h4', name: 'National University Hospital', address: '5 Lower Kent Ridge Rd, Singapore 119074', availableBeds: 167, totalBeds: 1200, icuAvailable: 14, traumaBays: 6, status: 'Limited', updatedAt: '01:50 pm' },
  { id: 'h5', name: 'Singapore General Hospital', address: 'Outram Rd, Singapore 169608', availableBeds: 203, totalBeds: 1785, icuAvailable: 23, traumaBays: 9, status: 'Limited', updatedAt: '01:50 pm' },
  { id: 'h6', name: 'Tan Tock Seng Hospital', address: '11 Jalan Tan Tock Seng, Singapore 308433', availableBeds: 240, totalBeds: 1415, icuAvailable: 18, traumaBays: 8, status: 'Normal', updatedAt: '01:50 pm' }
];

export const thresholds: ThresholdAlert[] = [
  { id: 't1', title: 'Open incidents threshold', current: 13, threshold: 10, status: 'Warning', recommendation: 'Create public broadcast for affected zones' },
  { id: 't2', title: 'Critical severity threshold', current: 10, threshold: 5, status: 'Critical', recommendation: 'Deploy Red Cross support teams' },
  { id: 't3', title: 'Hospital occupancy threshold', current: 86, threshold: 85, unit: '%', status: 'Critical', recommendation: 'Activate additional hospital surge beds' },
  { id: 't4', title: 'Infectious disease cases threshold', current: 44, threshold: 80, status: 'Normal', recommendation: 'Prepare vaccination rollout' },
  { id: 't5', title: 'Heat injury cases threshold', current: 31, threshold: 35, status: 'Warning', recommendation: 'Issue public health advisory' },
  { id: 't6', title: 'Flood reports threshold', current: 18, threshold: 12, status: 'Critical', recommendation: 'Create public broadcast for affected zones' }
];

export const notifications: NotificationItem[] = [
  { id: 'n1', type: 'assignment', text: 'Flooding at Orchard Road assigned to your organisation', time: '2 min ago' },
  { id: 'n2', type: 'update', text: 'SPF marked traffic diversion active at Scotts Road', time: '8 min ago' },
  { id: 'n3', type: 'broadcast', text: 'Public broadcast request awaiting review', time: '12 min ago' }
];
