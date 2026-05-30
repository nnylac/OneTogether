// Mirror of apps/frontend/src/data/seed.ts — backend in-memory store
export const db: Record<string, unknown[]> = {
  users: [
    { id: 'u-citizen', name: 'Amira Tan', email: 'citizen@onetogether.sg', role: 'citizen' },
    { id: 'u-org', name: 'Chen Xiao Ling', email: 'scdf@onetogether.sg', role: 'organisation', organisationId: 'scdf' },
    { id: 'u-gov', name: 'Raj Kumar', email: 'raj.kumar@gov.sg', role: 'government' },
  ],

  organisations: [
    { id: 'scdf', name: 'Singapore Civil Defence Force', type: 'Government', address: 'Buona Vista Fire Station, 51 Buona Vista Rd', verified: true, volunteersAvailable: 18, volunteersTotal: 25, activeTasks: 0, status: 'deployed' },
    { id: 'spf', name: 'Singapore Police Force', type: 'Government', address: 'New Phoenix Park, 28 Irrawaddy Rd', verified: true, volunteersAvailable: 0, volunteersTotal: 0, activeTasks: 3, status: 'deployed' },
    { id: 'sgh', name: 'Singapore General Hospital', type: 'Healthcare', address: 'Outram Rd', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'active' },
    { id: 'redcross', name: 'Singapore Red Cross - Jurong Chapter', type: 'NGO', address: 'Jurong West Sports Centre, 20 Jurong West St 93', verified: true, volunteersAvailable: 32, volunteersTotal: 48, activeTasks: 2, status: 'deployed' },
    { id: 'pa-jurong', name: "People's Association - Jurong West Volunteers", type: 'Grassroots', address: 'Jurong West Community Club, 20 Jurong West St 61', verified: true, volunteersAvailable: 85, volunteersTotal: 120, activeTasks: 1, status: 'active' },
    { id: 'stjohn', name: 'St John Ambulance Brigade - Jurong Unit', type: 'Healthcare', address: 'Jurong East MRT Station', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'deployed' },
    { id: 'tampines-cc', name: 'Tampines North Community Club - CARE Network', type: 'Grassroots', address: '10 Tampines St 91', verified: true, volunteersAvailable: 60, volunteersTotal: 95, activeTasks: 0, status: 'active' },
    { id: 'hsa', name: 'Health Sciences Authority', type: 'Government', address: '11 Outram Rd', verified: true, volunteersAvailable: 78, volunteersTotal: 245, activeTasks: 1, status: 'active' },
  ],

  incidents: [
    {
      id: 'INC-2026-0519', title: 'Cardiac Arrest at Orchard MRT', type: 'Medical', severity: 'Critical', status: 'On Scene', source: 'scdf_feed',
      createdBy: 'scdf', createdAt: '20 May 2026, 01:42 pm', location: 'Orchard MRT Exit B', zone: 'Central',
      description: 'Unconscious commuter, male, approx 55 years. AED deployed by station staff before SCDF arrival. Paramedic team on scene. Patient stabilised for transport.',
      assignedOrganisations: ['scdf', 'sgh'], respondingOrganisations: [{ organisation: 'SCDF', status: 'On Scene' }, { organisation: 'SGH', status: 'Trauma bay reserved' }],
      volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 2, volunteersResponded: 0, confidenceScore: 95, verifiedAt: '20 May 2026, 13:45',
      incidentCommander: 'Chen Xiao Ling',
      timeline: [
        { id: 'tl-0519-1', timestamp: '20 May 2026, 13:42', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Case opened from 995 dispatch feed. AED deployed by station staff confirmed.' },
        { id: 'tl-0519-2', timestamp: '20 May 2026, 13:45', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 95%. Status advanced to Verified.' },
        { id: 'tl-0519-3', timestamp: '20 May 2026, 13:48', organisation: 'SCDF', actor: 'SCDF-AMB-01 Crew', category: 'DEPLOY', text: 'SCDF-AMB-01 arrived Orchard MRT Exit B. Patient unconscious, CPR in progress by station staff.' },
        { id: 'tl-0519-4', timestamp: '20 May 2026, 13:52', organisation: 'SCDF', actor: 'SSI Rahman', category: 'MEDICAL', text: 'Paramedic team on scene. AED shock administered x2. ROSC achieved. Patient stabilised for transport to SGH.' },
      ],
    },
    {
      id: 'INC-2026-0520', title: 'Flash Flooding — Orchard / Scotts Road', type: 'Flood', severity: 'Critical', status: 'On Scene', source: 'scdf_feed',
      createdBy: 'scdf', createdAt: '20 May 2026, 01:50 pm', location: 'Orchard Road / Scotts Road underpass', zone: 'Central',
      description: 'Flash flooding affecting pedestrian underpasses, low-lying roads, and retail basement levels. 2 vehicles swept. Water level 45cm at Scotts Road underpass. Pumping operations active.',
      assignedOrganisations: ['scdf', 'spf', 'redcross'], respondingOrganisations: [{ organisation: 'SCDF', status: 'On Scene' }, { organisation: 'SPF', status: 'Perimeter secured' }, { organisation: 'Singapore Red Cross', status: 'Volunteer support deployed' }],
      volunteerSupportNeeded: true, publicVisibility: 'Public', unitsResponded: 7, volunteersResponded: 14, confidenceScore: 99, verifiedAt: '20 May 2026, 13:52',
      incidentCommander: 'Maj Rahman Bin Ismail',
      icsSection: { commander: 'Maj Rahman Bin Ismail', operations: 'SSI Chen Xiao Ling', logistics: 'SI Tan Wei Jie', pio: 'Raj Kumar' },
      timeline: [
        { id: 'tl-0520-1', timestamp: '20 May 2026, 13:50', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Flash flooding reported at Orchard Road / Scotts Road underpass. Multiple 995 calls received. NEA heavy rainfall advisory in effect.' },
        { id: 'tl-0520-2', timestamp: '20 May 2026, 13:52', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'DEPLOY', text: 'Pumping team, SCDF-BOAT-01, CERT-01, and 3 flood response units dispatched.' },
        { id: 'tl-0520-3', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory issued. Residents advised to avoid low-lying areas in Orchard zone.' },
        { id: 'tl-0520-4', timestamp: '20 May 2026, 14:04', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'Traffic diversion activated at Scotts Road junction. Lane closures at 4 intersections. No pedestrian casualties.' },
        { id: 'tl-0520-5', timestamp: '20 May 2026, 14:08', organisation: 'SCDF', actor: 'SI Tan Wei Jie', category: 'ASSESS', text: 'Flood level at Scotts Road underpass: 45cm. 2 vehicles partially submerged. No persons trapped. Pumps operational.' },
      ],
    },
    {
      id: 'INC-2026-0521', title: 'Construction Site Fall Injury — Marina Bay', type: 'Medical', severity: 'High', status: 'Dispatched', source: 'hospital_feed',
      createdBy: 'sgh', createdAt: '20 May 2026, 01:36 pm', location: 'Marina Bay Sands construction annex, Bay Front Ave', zone: 'Central',
      description: 'Worker fall from scaffolding at level 4. Suspected spinal injury. SCDF-AMB-02 dispatched. SGH trauma bay reserved.',
      assignedOrganisations: ['sgh', 'scdf'], respondingOrganisations: [{ organisation: 'SCDF', status: 'En route' }, { organisation: 'SGH', status: 'Trauma bay reserved' }],
      volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 1, volunteersResponded: 0, confidenceScore: 88, verifiedAt: '20 May 2026, 13:40',
      timeline: [
        { id: 'tl-0521-1', timestamp: '20 May 2026, 13:36', organisation: 'SGH', actor: 'SGH Trauma Coordinator', category: 'INITIAL', text: 'Trauma ticket created via hospital source system. Worker fall from scaffolding level 4. Trauma bay reserved.' },
        { id: 'tl-0521-2', timestamp: '20 May 2026, 13:40', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 88%. SCDF-AMB-02 dispatched, ETA 8 minutes.' },
      ],
    },
    {
      id: 'INC-2026-0522', title: 'MRT Power Fault — North-South Line', type: 'Infrastructure', severity: 'High', status: 'Verified', source: 'spf_feed',
      createdBy: 'spf', createdAt: '20 May 2026, 01:50 pm', location: 'North-South Line — Bishan to Orchard segment', zone: 'North',
      description: 'Power fault causing service suspension and station overcrowding. Bridging bus services deployed. SMRT estimating 45-minute recovery window.',
      assignedOrganisations: ['spf'], respondingOrganisations: [{ organisation: 'SPF', status: 'Crowd control deployed' }],
      volunteerSupportNeeded: false, publicVisibility: 'Public', unitsResponded: 3, volunteersResponded: 0, confidenceScore: 80, verifiedAt: '20 May 2026, 13:55',
      timeline: [
        { id: 'tl-0522-1', timestamp: '20 May 2026, 13:50', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'Power fault on North-South Line confirmed via SMRT ops feed. Station crowding reported at Bishan, Toa Payoh, Novena.' },
        { id: 'tl-0522-2', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'ASSESS', text: 'Incident verified. Power engineering fault, not structural. SPF managing crowd. SMRT estimating 45-min recovery.' },
      ],
    },
    {
      id: 'INC-2026-0523', title: 'Partial Building Collapse — Toa Payoh HDB', type: 'Infrastructure', severity: 'Critical', status: 'On Scene', source: 'scdf_feed',
      createdBy: 'scdf', createdAt: '20 May 2026, 01:18 pm', location: 'Blk 93 Toa Payoh Lorong 4, #05-120', zone: 'Central',
      description: 'Partial collapse of corridor slab at Blk 93 Toa Payoh during HIP renovation works. 3 persons initially reported trapped. USAR team on scene.',
      assignedOrganisations: ['scdf', 'sgh', 'spf'], respondingOrganisations: [{ organisation: 'SCDF', status: 'USAR on scene' }, { organisation: 'SGH', status: 'Receiving casualties' }, { organisation: 'SPF', status: 'Perimeter secured' }],
      volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 5, volunteersResponded: 0, confidenceScore: 97, verifiedAt: '20 May 2026, 13:20',
      incidentCommander: 'Mdm Lim Bee Hoon',
      icsSection: { commander: 'Mdm Lim Bee Hoon', operations: 'Capt Yap Zhong Han', logistics: 'LTA Ng Poh Ching' },
      timeline: [
        { id: 'tl-0523-1', timestamp: '20 May 2026, 13:18', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Structural collapse reported via 995. Multiple calls from residents at Toa Payoh Lorong 4.' },
        { id: 'tl-0523-5', timestamp: '20 May 2026, 13:45', organisation: 'SCDF', actor: 'USAR Team Alpha', category: 'MEDICAL', text: 'First casualty extracted — male, 40s, leg fracture. Transported to TTSH. 2 persons still unaccounted.' },
      ],
    },
    {
      id: 'INC-2026-0525', title: 'Mass Casualty — NSL Train Collision Bishan', type: 'Medical', severity: 'Critical', status: 'On Scene', source: 'scdf_feed',
      createdBy: 'scdf', createdAt: '20 May 2026, 01:03 pm', location: 'NSL between Bishan and Braddell MRT stations', zone: 'Central',
      description: 'Two-train low-speed collision on North-South Line. Initial report: 18 casualties across 2 trains. 4 P1 (critical), 7 P2, 7 P3. Mass casualty protocol activated.',
      assignedOrganisations: ['scdf', 'sgh', 'spf', 'stjohn'], respondingOrganisations: [{ organisation: 'SCDF', status: 'Mass casualty command on scene' }, { organisation: 'SGH', status: 'MCI protocol activated' }, { organisation: 'SPF', status: 'Perimeter and traffic control' }, { organisation: 'St John Ambulance', status: 'P3 triage support' }],
      volunteerSupportNeeded: true, publicVisibility: 'Public', unitsResponded: 8, volunteersResponded: 22, confidenceScore: 99, verifiedAt: '20 May 2026, 13:05',
      incidentCommander: 'COL (SCDF) David Loh',
      icsSection: { commander: 'COL (SCDF) David Loh', operations: 'LTC Faridah Binte Sulaiman', planning: 'SSI Marcus Tan', logistics: 'LTA Cheah Siew Hong', pio: 'Raj Kumar' },
      timeline: [
        { id: 'tl-0525-1', timestamp: '20 May 2026, 13:03', organisation: 'SCDF', actor: 'SCDF Ops Centre', category: 'INITIAL', text: '995 mass alert: 2-train collision on NSL. Mass casualty protocol activated.' },
        { id: 'tl-0525-4', timestamp: '20 May 2026, 13:12', organisation: 'SCDF', actor: 'SSI Marcus Tan', category: 'MEDICAL', text: 'Triage station established trackside. METHANE report filed. 18 casualties confirmed.' },
      ],
    },
    {
      id: 'INC-2026-0526', title: 'Island-wide Substation Failure — Tuas / Paya Lebar Grid', type: 'Infrastructure', severity: 'High', status: 'Contained', source: 'spf_feed',
      createdBy: 'spf', createdAt: '20 May 2026, 12:10 pm', location: 'Tuas South 400kV Substation + Paya Lebar Grid', zone: 'National',
      description: 'Cascading failure from Tuas South 400kV substation caused partial island-wide power disruption across 14 residential zones and 2 hospitals. 60% restored.',
      assignedOrganisations: ['scdf', 'spf', 'sgh'], respondingOrganisations: [{ organisation: 'SCDF', status: 'Lift rescue operations' }, { organisation: 'SP Group', status: 'Grid restoration ongoing' }],
      volunteerSupportNeeded: false, publicVisibility: 'Public', unitsResponded: 12, volunteersResponded: 0, confidenceScore: 99, verifiedAt: '20 May 2026, 12:15',
      timeline: [
        { id: 'tl-0526-1', timestamp: '20 May 2026, 12:10', organisation: 'SP Group', actor: 'SP Group Ops', category: 'INITIAL', text: 'SP Group emergency alert: major grid disruption. Tuas South 400kV substation offline.' },
        { id: 'tl-0526-5', timestamp: '20 May 2026, 13:45', organisation: 'SP Group', actor: 'SP Group Ops', category: 'STATUS', text: '60% of affected zones restored. 3 zones still on rolling blackout. Full restoration targeted by 17:00.' },
      ],
    },
    {
      id: 'INC-2026-0527', title: 'Dengue Cluster — Woodlands Crescent', type: 'Medical', severity: 'Medium', status: 'Reported', source: 'hospital_feed',
      createdBy: 'hsa', createdAt: '20 May 2026, 02:05 pm', location: 'Woodlands Crescent Estate, Woodlands Drive 65 — Blk 201–208', zone: 'North',
      description: '14 confirmed dengue fever cases traced to Woodlands Crescent estate over 14 days. High Aedes aegypti breeding density confirmed. Environmental fogging requested.',
      assignedOrganisations: ['hsa'], respondingOrganisations: [{ organisation: 'HSA / HPB', status: 'Contact tracing initiated' }, { organisation: 'NEA', status: 'Vector control requested' }],
      volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 0, volunteersResponded: 0, confidenceScore: 82,
      timeline: [
        { id: 'tl-0527-1', timestamp: '20 May 2026, 14:05', organisation: 'HSA', actor: 'HPB Epidemiology', category: 'INITIAL', text: 'MOH dengue cluster alert flagged from polyclinic reports. 14 lab-confirmed dengue cases in last 14 days.' },
      ],
    },
    {
      id: 'INC-2026-0528', title: 'Suspicious Unattended Package — Raffles Place MRT', type: 'Civil', severity: 'Critical', status: 'Unverified', source: 'spf_feed',
      createdBy: 'spf', createdAt: '20 May 2026, 02:01 pm', location: 'Raffles Place MRT Exit B, Fullerton Road entrance', zone: 'Central',
      description: 'Unattended backpack left at Exit B for 45+ minutes. Station partially cordoned. SPF EOD team en route for assessment. Confidence low — assessment ongoing.',
      assignedOrganisations: ['spf', 'scdf'], respondingOrganisations: [{ organisation: 'SPF EOD', status: 'En route' }, { organisation: 'SCDF', status: 'Standby' }],
      volunteerSupportNeeded: false, publicVisibility: 'Private', unitsResponded: 1, volunteersResponded: 0, confidenceScore: 45,
      timeline: [
        { id: 'tl-0528-1', timestamp: '20 May 2026, 14:01', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'MRT station staff reported unattended bag at Exit B, left for 45+ minutes. SPF alerted via 999 dispatch.' },
      ],
    },
  ],

  broadcasts: [
    { id: 'b-flood-01', title: 'Flash Flood Alert — Orchard Road Area', severity: 'CRITICAL', audience: 'all', zone: 'Central', message: 'Flash flooding is affecting the Orchard Road / Scotts Road area. Avoid all underpasses and low-lying roads in the Orchard zone. SCDF pumping operations are active. Call 995 if trapped.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:55 pm', icon: 'Waves', linkedIncidentId: 'INC-2026-0520' },
    { id: 'b-mrt-01', title: 'NSL Service Suspended — Bishan to Newton', severity: 'NOTICE', audience: 'all', zone: 'Central', message: 'North-South Line service is suspended between Bishan and Newton stations due to an emergency incident. Free bridging buses are deployed. Allow extra travel time. Follow station staff instructions.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:15 pm', icon: 'Train' },
    { id: 'b-power-01', title: 'Power Disruption — Multiple Zones', severity: 'NOTICE', audience: 'all', message: 'A power disruption is affecting parts of Jurong West, Tampines North, and Woodlands. SP Group is working to restore supply. Do NOT use lifts. Report trapped persons to 995.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 12:25 pm', icon: 'Megaphone' },
    { id: 'b-resp-01', title: 'SITREP: NSL MCI — All Responding Units', severity: 'NOTICE', audience: 'responders', message: 'NSL MCI SITREP 13:30: All 18 casualties extracted. 4 P1 transported to SGH. 7 P2 stabilised on scene, transport in progress. SPF perimeter held. SMRT engineering team on standby. ICS transitioning to hospital coordination. EOC ACTIVE.', issuer: 'COL David Loh', timestamp: '20 May 2026, 01:30 pm', icon: 'ShieldAlert' },
  ],

  hospitals: [
    { id: 'h-sgh', name: 'Singapore General Hospital', address: 'Outram Rd, Singapore 169608', availableBeds: 12, totalBeds: 1785, icuAvailable: 3, traumaBays: 6, status: 'Critical', updatedAt: '02:04 pm' },
    { id: 'h-ttsh', name: 'Tan Tock Seng Hospital', address: '11 Jln Tan Tock Seng, Singapore 308433', availableBeds: 34, totalBeds: 1700, icuAvailable: 8, traumaBays: 4, status: 'Limited', updatedAt: '01:58 pm' },
    { id: 'h-nuh', name: 'National University Hospital', address: '5 Lower Kent Ridge Rd, Singapore 119074', availableBeds: 67, totalBeds: 1200, icuAvailable: 12, traumaBays: 4, status: 'Limited', updatedAt: '01:45 pm' },
    { id: 'h-cgh', name: 'Changi General Hospital', address: '2 Simei St 3, Singapore 529889', availableBeds: 134, totalBeds: 1000, icuAvailable: 22, traumaBays: 3, status: 'Normal', updatedAt: '02:00 pm' },
    { id: 'h-khh', name: 'Khoo Teck Puat Hospital', address: '90 Yishun Central, Singapore 768828', availableBeds: 89, totalBeds: 795, icuAvailable: 11, traumaBays: 2, status: 'Normal', updatedAt: '01:50 pm' },
    { id: 'h-ntfgh', name: 'Ng Teng Fong General Hospital', address: '1 Jurong East St 21, Singapore 609606', availableBeds: 18, totalBeds: 700, icuAvailable: 4, traumaBays: 3, status: 'Limited', updatedAt: '02:02 pm' },
  ],

  volunteerTasks: [
    { id: 'vt-001', title: 'Flood Relief — Emergency Food Packing', organisation: 'Singapore Red Cross', location: 'Jurong West Sports Centre', time: 'Today 3:00 PM – 8:00 PM', urgency: 'Critical', skills: ['Physical fitness', 'Packing'], slotsFilled: 18, slotsTotal: 30, status: 'Filling', description: 'Pack and distribute emergency food rations for displaced flood residents in the Orchard / Scotts Road area.' },
    { id: 'vt-002', title: 'Evacuation Centre Registration Desk', organisation: "People's Association - Jurong West Volunteers", location: 'Jurong West Community Club', time: 'Today 2:00 PM – 10:00 PM', urgency: 'High', skills: ['Admin', 'Bilingual'], slotsFilled: 6, slotsTotal: 12, status: 'Filling', description: 'Man the registration desk at the temporary evacuation centre. Assist displaced residents with registration and welfare checks.' },
    { id: 'vt-003', title: 'NSL MCI — P3 Casualty First Aid Support', organisation: 'St John Ambulance Brigade - Jurong Unit', location: 'Bishan MRT — Incident Command Post', time: 'Immediate (until stood down)', urgency: 'Critical', skills: ['First Aid', 'CERT trained'], slotsFilled: 22, slotsTotal: 25, status: 'Filling', description: 'Provide first aid to P3 (walking wounded) casualties from the NSL train collision. Work under SCDF ICS command.' },
    { id: 'vt-004', title: 'Community Welfare Calls — Power Outage Residents', organisation: 'Tampines North Community Club - CARE Network', location: 'Remote (phone-based)', time: 'Today 4:00 PM – 9:00 PM', urgency: 'Medium', skills: ['Communication', 'Bilingual (Mandarin/Malay preferred)'], slotsFilled: 10, slotsTotal: 30, status: 'Filling', description: 'Call elderly and vulnerable residents in affected blackout zones to check on welfare and provide basic guidance.' },
  ],

  communityProgrammes: [
    { id: 'cp-001', title: 'CERT Basic Emergency Preparedness Course', organisation: 'Singapore Civil Defence Force', location: 'Toa Payoh Civil Defence Division', time: 'Sat 24 May 2026, 9:00 AM – 5:00 PM', category: 'Training', tags: ['CERT', 'First aid', 'Fire safety', 'Evacuation'], registered: 38, capacity: 48, description: 'Learn essential emergency preparedness skills: fire suppression, basic first aid, search and rescue. CERT certification awarded on completion.', contact: 'scdf.cert@scdf.gov.sg' },
    { id: 'cp-002', title: 'Community Flood Preparedness Workshop', organisation: "People's Association - Jurong West Volunteers", location: 'Jurong West Community Club, Hall B', time: 'Sun 25 May 2026, 2:00 PM – 5:00 PM', category: 'Preparedness', tags: ['Flood', 'Home safety', 'Evacuation plan'], registered: 52, capacity: 80, description: 'Practical workshop on flood preparedness for Jurong West residents. Learn to create a home evacuation plan, prepare an emergency kit, and identify safe routes.', contact: 'pa.jurongwest@gmail.com' },
    { id: 'cp-003', title: 'Dengue Prevention Block Party', organisation: 'Tampines North Community Club - CARE Network', location: 'Tampines North CC Void Deck', time: 'Sat 31 May 2026, 10:00 AM – 1:00 PM', category: 'Awareness', tags: ['Dengue', 'Vector control', 'Community'], registered: 65, capacity: 120, description: 'Join your neighbours for a community Mozzie Wipeout and dengue awareness session. Free larvicide and repellent kits provided.', contact: 'tampinesnorth.cc@pa.gov.sg' },
    { id: 'cp-004', title: 'Disaster Relief Donation Drive', organisation: 'Singapore Red Cross - Jurong Chapter', location: 'Jurong West Sports Centre', time: 'Ongoing — Mon–Fri, 9:00 AM – 6:00 PM', category: 'Relief', tags: ['Donation', 'Relief goods', 'Food packs'], registered: 142, capacity: 500, description: 'Drop off non-perishable food, bottled water, hygiene kits, and clothing for displaced residents affected by the Orchard Road flooding. All donations accepted.', contact: 'redcross.jurong@redcross.org.sg' },
  ],

  thresholds: [
    { id: 'th-001', title: 'Open Critical Incidents', current: 5, threshold: 3, unit: '', status: 'Critical', recommendation: 'Activate EOC Level 2 response. Request mutual aid from neighbouring regions.' },
    { id: 'th-002', title: 'SGH Bed Occupancy', current: 99, threshold: 95, unit: '%', status: 'Critical', recommendation: 'Activate hospital surge protocol. Divert non-critical cases to CGH and KTPH.' },
    { id: 'th-003', title: 'Active Flood Incidents', current: 2, threshold: 3, unit: '', status: 'Warning', recommendation: 'Pre-position additional SCDF pumping units. Alert PUB drainage operations.' },
    { id: 'th-004', title: 'Volunteer Deployment Rate', current: 74, threshold: 80, unit: '%', status: 'Warning', recommendation: 'Activate standby volunteer pool. Notify NVPC for additional volunteer mobilisation.' },
    { id: 'th-005', title: 'SCDF Units Available', current: 6, threshold: 5, unit: '', status: 'Normal', recommendation: 'Monitor. At threshold, request SCDF mutual aid from adjacent divisions.' },
  ],

  units: [
    { id: 'u-scdf-amb-01', callSign: 'SCDF-AMB-01', type: 'Ambulance', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0519' },
    { id: 'u-scdf-amb-02', callSign: 'SCDF-AMB-02', type: 'Ambulance', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0525' },
    { id: 'u-scdf-amb-03', callSign: 'SCDF-AMB-03', type: 'Ambulance', status: 'Available', organisation: 'SCDF' },
    { id: 'u-scdf-amb-04', callSign: 'SCDF-AMB-04', type: 'Ambulance', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0525' },
    { id: 'u-scdf-fe-01', callSign: 'SCDF-FE-01', type: 'Fire Engine', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
    { id: 'u-scdf-fe-02', callSign: 'SCDF-FE-02', type: 'Fire Engine', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0523' },
    { id: 'u-scdf-fe-03', callSign: 'SCDF-FE-03', type: 'Fire Engine', status: 'Available', organisation: 'SCDF' },
    { id: 'u-scdf-boat-01', callSign: 'SCDF-BOAT-01', type: 'Boat', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
    { id: 'u-scdf-drone-01', callSign: 'SCDF-DRONE-01', type: 'Drone', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0523' },
    { id: 'u-spf-01', callSign: 'SPF-PC-01', type: 'Police', status: 'On Scene', organisation: 'Singapore Police Force', assignedIncidentId: 'INC-2026-0528' },
    { id: 'u-spf-02', callSign: 'SPF-PC-02', type: 'Police', status: 'On Scene', organisation: 'Singapore Police Force', assignedIncidentId: 'INC-2026-0520' },
    { id: 'u-sjab-01', callSign: 'SJAB-MED-01', type: 'Medical Team', status: 'On Scene', organisation: 'St John Ambulance Brigade - Jurong Unit', assignedIncidentId: 'INC-2026-0525' },
    { id: 'u-cert-01', callSign: 'CERT-JURONG-01', type: 'CERT Team', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
    { id: 'u-cert-02', callSign: 'CERT-BISHAN-01', type: 'CERT Team', status: 'Available', organisation: 'SCDF' },
  ],

  notifications: [
    { id: 'n-001', text: 'INC-2026-0520 — Flash Flood assigned to your organisation', time: '12 min ago', type: 'assignment' },
    { id: 'n-002', text: 'INC-2026-0525 — Mass Casualty: volunteer support requested', time: '28 min ago', type: 'update' },
    { id: 'n-003', text: 'New broadcast published: Flash Flood Alert — Orchard Road', time: '32 min ago', type: 'broadcast' },
    { id: 'n-004', text: 'INC-2026-0523 — Building collapse: status updated to On Scene', time: '45 min ago', type: 'update' },
  ],
};
