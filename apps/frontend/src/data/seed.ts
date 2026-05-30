import type { Broadcast, CommunityProgramme, Hospital, Incident, NotificationItem, Organisation, ResourceUnit, ThresholdAlert, User, VolunteerTask } from '../types';

export const users: User[] = [
  { id: 'u-citizen', name: 'Amira Tan', email: 'citizen@onetogether.sg', role: 'citizen' },
  { id: 'u-org', name: 'Chen Xiao Ling', email: 'scdf@onetogether.sg', role: 'organisation', organisationId: 'scdf' },
  { id: 'u-gov', name: 'Raj Kumar', email: 'raj.kumar@gov.sg', role: 'government' }
];

export const organisations: Organisation[] = [
  { id: 'scdf', name: 'Singapore Civil Defence Force', type: 'Government', address: 'Buona Vista Fire Station, 51 Buona Vista Rd', verified: true, volunteersAvailable: 18, volunteersTotal: 25, activeTasks: 0, status: 'deployed' },
  { id: 'spf', name: 'Singapore Police Force', type: 'Government', address: 'New Phoenix Park, 28 Irrawaddy Rd', verified: true, volunteersAvailable: 0, volunteersTotal: 0, activeTasks: 3, status: 'deployed' },
  { id: 'sgh', name: 'Singapore General Hospital', type: 'Healthcare', address: 'Outram Rd', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'active' },
  { id: 'redcross', name: 'Singapore Red Cross - Jurong Chapter', type: 'NGO', address: 'Jurong West Sports Centre, 20 Jurong West St 93', verified: true, volunteersAvailable: 32, volunteersTotal: 48, activeTasks: 2, status: 'deployed' },
  { id: 'pa-jurong', name: "People's Association - Jurong West Volunteers", type: 'Grassroots', address: 'Jurong West Community Club, 20 Jurong West St 61', verified: true, volunteersAvailable: 85, volunteersTotal: 120, activeTasks: 1, status: 'active' },
  { id: 'stjohn', name: 'St John Ambulance Brigade - Jurong Unit', type: 'Healthcare', address: 'Jurong East MRT Station', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'deployed' },
  { id: 'tampines-cc', name: 'Tampines North Community Club - CARE Network', type: 'Grassroots', address: '10 Tampines St 91', verified: true, volunteersAvailable: 60, volunteersTotal: 95, activeTasks: 0, status: 'active' },
  { id: 'hsa', name: 'Health Sciences Authority', type: 'Government', address: '11 Outram Rd', verified: true, volunteersAvailable: 78, volunteersTotal: 245, activeTasks: 1, status: 'active' }
];

export const incidents: Incident[] = [
  {
    id: 'INC-2026-0519',
    title: 'Cardiac Arrest at Orchard MRT',
    type: 'Medical',
    severity: 'Critical',
    status: 'On Scene',
    source: 'scdf_feed',
    createdBy: 'scdf',
    createdAt: '20 May 2026, 01:42 pm',
    location: 'Orchard MRT Exit B',
    zone: 'Central',
    description: 'Unconscious commuter, male, approx 55 years. AED deployed by station staff before SCDF arrival. Paramedic team on scene. Patient stabilised for transport.',
    assignedOrganisations: ['scdf', 'sgh'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'On Scene' }, { organisation: 'SGH', status: 'Trauma bay reserved' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 2,
    volunteersResponded: 0,
    confidenceScore: 95,
    verifiedAt: '20 May 2026, 13:45',
    incidentCommander: 'Chen Xiao Ling',
    timeline: [
      { id: 'tl-0519-1', timestamp: '20 May 2026, 13:42', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Case opened from 995 dispatch feed. AED deployed by station staff confirmed.' },
      { id: 'tl-0519-2', timestamp: '20 May 2026, 13:45', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 95%. Status advanced to Verified.' },
      { id: 'tl-0519-3', timestamp: '20 May 2026, 13:48', organisation: 'SCDF', actor: 'SCDF-AMB-01 Crew', category: 'DEPLOY', text: 'SCDF-AMB-01 arrived Orchard MRT Exit B. Patient unconscious, CPR in progress by station staff.' },
      { id: 'tl-0519-4', timestamp: '20 May 2026, 13:52', organisation: 'SCDF', actor: 'SSI Rahman', category: 'MEDICAL', text: 'Paramedic team on scene. AED shock administered x2. ROSC achieved. Patient stabilised for transport to SGH.' }
    ]
  },
  {
    id: 'INC-2026-0520',
    title: 'Flash Flooding — Orchard / Scotts Road',
    type: 'Flood',
    severity: 'Critical',
    status: 'On Scene',
    source: 'scdf_feed',
    createdBy: 'scdf',
    createdAt: '20 May 2026, 01:50 pm',
    location: 'Orchard Road / Scotts Road underpass',
    zone: 'Central',
    description: 'Flash flooding affecting pedestrian underpasses, low-lying roads, and retail basement levels. 2 vehicles swept. Water level 45cm at Scotts Road underpass. Pumping operations active.',
    assignedOrganisations: ['scdf', 'spf', 'redcross'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'On Scene' }, { organisation: 'SPF', status: 'Perimeter secured' }, { organisation: 'Singapore Red Cross', status: 'Volunteer support deployed' }],
    volunteerSupportNeeded: true,
    publicVisibility: 'Public',
    unitsResponded: 7,
    volunteersResponded: 14,
    confidenceScore: 99,
    verifiedAt: '20 May 2026, 13:52',
    incidentCommander: 'Maj Rahman Bin Ismail',
    icsSection: { commander: 'Maj Rahman Bin Ismail', operations: 'SSI Chen Xiao Ling', logistics: 'SI Tan Wei Jie', pio: 'Raj Kumar' },
    timeline: [
      { id: 'tl-0520-1', timestamp: '20 May 2026, 13:50', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Flash flooding reported at Orchard Road / Scotts Road underpass. Multiple 995 calls received. NEA heavy rainfall advisory in effect.' },
      { id: 'tl-0520-2', timestamp: '20 May 2026, 13:52', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'DEPLOY', text: 'Pumping team, SCDF-BOAT-01, CERT-01, and 3 flood response units dispatched. SCDF-FE-01 pre-positioned.' },
      { id: 'tl-0520-3', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory issued. Residents advised to avoid low-lying areas in Orchard zone. Gov.sg alert sent.' },
      { id: 'tl-0520-4', timestamp: '20 May 2026, 14:04', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'Traffic diversion activated at Scotts Road junction. Lane closures at 4 intersections. No pedestrian casualties.' },
      { id: 'tl-0520-5', timestamp: '20 May 2026, 14:08', organisation: 'SCDF', actor: 'SI Tan Wei Jie', category: 'ASSESS', text: 'Flood level at Scotts Road underpass: 45cm. 2 vehicles partially submerged. No persons trapped. Pumps operational.' },
      { id: 'tl-0520-6', timestamp: '20 May 2026, 14:15', organisation: 'PUB', actor: 'PUB Ops', category: 'COORD', text: 'PUB activated drainage pumps at Somerset canal. Water levels expected to recede by 16:00 hrs.' }
    ]
  },
  {
    id: 'INC-2026-0521',
    title: 'Construction Site Fall Injury — Marina Bay',
    type: 'Medical',
    severity: 'High',
    status: 'Dispatched',
    source: 'hospital_feed',
    createdBy: 'sgh',
    createdAt: '20 May 2026, 01:36 pm',
    location: 'Marina Bay Sands construction annex, Bay Front Ave',
    zone: 'Central',
    description: 'Worker fall from scaffolding at level 4. Suspected spinal injury. SCDF-AMB-02 dispatched. SGH trauma bay reserved.',
    assignedOrganisations: ['sgh', 'scdf'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'En route' }, { organisation: 'SGH', status: 'Trauma bay reserved' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 1,
    volunteersResponded: 0,
    confidenceScore: 88,
    verifiedAt: '20 May 2026, 13:40',
    timeline: [
      { id: 'tl-0521-1', timestamp: '20 May 2026, 13:36', organisation: 'SGH', actor: 'SGH Trauma Coordinator', category: 'INITIAL', text: 'Trauma ticket created via hospital source system. Worker fall from scaffolding level 4. Trauma bay reserved.' },
      { id: 'tl-0521-2', timestamp: '20 May 2026, 13:40', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 88%. SCDF-AMB-02 dispatched, ETA 8 minutes.' }
    ]
  },
  {
    id: 'INC-2026-0522',
    title: 'MRT Power Fault — North-South Line',
    type: 'Infrastructure',
    severity: 'High',
    status: 'Verified',
    source: 'spf_feed',
    createdBy: 'spf',
    createdAt: '20 May 2026, 01:50 pm',
    location: 'North-South Line — Bishan to Orchard segment',
    zone: 'North',
    description: 'Power fault causing service suspension and station overcrowding. Bridging bus services deployed. SMRT estimating 45-minute recovery window.',
    assignedOrganisations: ['spf'],
    respondingOrganisations: [{ organisation: 'SPF', status: 'Crowd control deployed' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Public',
    unitsResponded: 3,
    volunteersResponded: 0,
    confidenceScore: 80,
    verifiedAt: '20 May 2026, 13:55',
    timeline: [
      { id: 'tl-0522-1', timestamp: '20 May 2026, 13:50', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'Power fault on North-South Line confirmed via SMRT ops feed. Station crowding reported at Bishan, Toa Payoh, Novena.' },
      { id: 'tl-0522-2', timestamp: '20 May 2026, 13:53', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'SPF crowd control officers deployed to Bishan, Toa Payoh, Novena stations. SMRT bridging buses activated.' },
      { id: 'tl-0522-3', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'ASSESS', text: 'Incident verified. Power engineering fault, not structural. SPF managing crowd. SMRT estimating 45-min recovery.' }
    ]
  },
  {
    id: 'INC-2026-0523',
    title: 'Partial Building Collapse — Toa Payoh HDB',
    type: 'Infrastructure',
    severity: 'Critical',
    status: 'On Scene',
    source: 'scdf_feed',
    createdBy: 'scdf',
    createdAt: '20 May 2026, 01:18 pm',
    location: 'Blk 93 Toa Payoh Lorong 4, #05-120',
    zone: 'Central',
    description: 'Partial collapse of corridor slab at Blk 93 Toa Payoh during HIP renovation works. 3 persons initially reported trapped. USAR team on scene. Structural assessment ongoing.',
    assignedOrganisations: ['scdf', 'sgh', 'spf'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'USAR on scene' }, { organisation: 'SGH', status: 'Receiving casualties' }, { organisation: 'SPF', status: 'Perimeter secured' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 5,
    volunteersResponded: 0,
    confidenceScore: 97,
    verifiedAt: '20 May 2026, 13:20',
    incidentCommander: 'Mdm Lim Bee Hoon',
    icsSection: { commander: 'Mdm Lim Bee Hoon', operations: 'Capt Yap Zhong Han', logistics: 'LTA Ng Poh Ching' },
    timeline: [
      { id: 'tl-0523-1', timestamp: '20 May 2026, 13:18', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Structural collapse reported via 995. Multiple calls from residents at Toa Payoh Lorong 4. Dust cloud visible.' },
      { id: 'tl-0523-2', timestamp: '20 May 2026, 13:20', organisation: 'SCDF', actor: 'Mdm Lim Bee Hoon', category: 'ASSESS', text: 'Incident verified. Confidence 97%. Corridor slab collapse confirmed via CCTV. 3 persons unaccounted for.' },
      { id: 'tl-0523-3', timestamp: '20 May 2026, 13:22', organisation: 'SCDF', actor: 'Capt Yap Zhong Han', category: 'DEPLOY', text: 'USAR team deployed with cutting equipment. SCDF-FE-02 on scene. SPF perimeter set at 50m radius. Floors 4–8 evacuated.' },
      { id: 'tl-0523-4', timestamp: '20 May 2026, 13:30', organisation: 'BCA', actor: 'BCA Structural Engineer', category: 'COORD', text: 'BCA structural engineer on site. Preliminary assessment: slab failure at column junction. Secondary collapse risk moderate.' },
      { id: 'tl-0523-5', timestamp: '20 May 2026, 13:45', organisation: 'SCDF', actor: 'USAR Team Alpha', category: 'MEDICAL', text: 'First casualty extracted — male, 40s, leg fracture. Transported to TTSH. Condition stable. 2 persons still unaccounted.' },
      { id: 'tl-0523-6', timestamp: '20 May 2026, 13:58', organisation: 'SCDF', actor: 'Mdm Lim Bee Hoon', category: 'STATUS', text: 'Status: On Scene. Active rescue for 2 remaining persons. Shoring props installed. Risk of secondary collapse low per BCA.' }
    ]
  },
  {
    id: 'INC-2026-0524',
    title: 'Industrial Chemical Spill — Jurong Chemical Park',
    type: 'Infrastructure',
    severity: 'High',
    status: 'Dispatched',
    source: 'scdf_feed',
    createdBy: 'scdf',
    createdAt: '20 May 2026, 01:55 pm',
    location: 'Jurong Chemical Park, 100 Jurong Island Hwy — Bay 7',
    zone: 'West',
    description: 'Sodium hydroxide (NaOH) spill from ruptured 1000L IBC tank at processing facility Bay 7. 3 workers with chemical burns. Facility evacuation of adjacent units initiated. SCDF HazMat team en route.',
    assignedOrganisations: ['scdf', 'spf'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'En route (HazMat)' }, { organisation: 'SPF', status: 'Exclusion zone declared' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 2,
    volunteersResponded: 0,
    confidenceScore: 91,
    timeline: [
      { id: 'tl-0524-1', timestamp: '20 May 2026, 13:55', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'HazMat alert received from Jurong Chemical Park facility safety officer. NaOH spill confirmed. 3 workers with chemical exposure.' },
      { id: 'tl-0524-2', timestamp: '20 May 2026, 13:57', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'DEPLOY', text: 'SCDF HazMat Team 1 and SCDF-FE-01 dispatched from Jurong Island Station. ETA 9 minutes.' },
      { id: 'tl-0524-3', timestamp: '20 May 2026, 13:59', organisation: 'NEA', actor: 'NEA HazMat', category: 'COORD', text: 'NEA notified. 200m exclusion zone declared. Wind direction 040°, speed 12 knots. Neighbouring facilities on standby evacuation.' }
    ]
  },
  {
    id: 'INC-2026-0525',
    title: 'Mass Casualty — NSL Train Collision Bishan',
    type: 'Medical',
    severity: 'Critical',
    status: 'On Scene',
    source: 'scdf_feed',
    createdBy: 'scdf',
    createdAt: '20 May 2026, 01:03 pm',
    location: 'NSL between Bishan and Braddell MRT stations',
    zone: 'Central',
    description: 'Two-train low-speed collision on North-South Line between Bishan and Braddell. Initial report: 18 casualties across 2 trains. 4 P1 (critical), 7 P2, 7 P3. Mass casualty protocol activated. Trains halted trackside, patient extraction ongoing.',
    assignedOrganisations: ['scdf', 'sgh', 'spf', 'stjohn'],
    respondingOrganisations: [
      { organisation: 'SCDF', status: 'Mass casualty command on scene' },
      { organisation: 'SGH', status: 'MCI protocol activated' },
      { organisation: 'SPF', status: 'Perimeter and traffic control' },
      { organisation: 'St John Ambulance', status: 'P3 triage support' }
    ],
    volunteerSupportNeeded: true,
    publicVisibility: 'Public',
    unitsResponded: 8,
    volunteersResponded: 22,
    confidenceScore: 99,
    verifiedAt: '20 May 2026, 13:05',
    incidentCommander: 'COL (SCDF) David Loh',
    icsSection: { commander: 'COL (SCDF) David Loh', operations: 'LTC Faridah Binte Sulaiman', planning: 'SSI Marcus Tan', logistics: 'LTA Cheah Siew Hong', pio: 'Raj Kumar' },
    timeline: [
      { id: 'tl-0525-1', timestamp: '20 May 2026, 13:03', organisation: 'SCDF', actor: 'SCDF Ops Centre', category: 'INITIAL', text: '995 mass alert: 2-train collision on NSL. Mass casualty protocol activated. All available AMB units and CERT teams redirected.' },
      { id: 'tl-0525-2', timestamp: '20 May 2026, 13:05', organisation: 'SCDF', actor: 'COL David Loh', category: 'DEPLOY', text: 'SCDF-AMB-01, 02, 03 + 2 CERT teams dispatched. SCDF-AMB-04, 05 pre-positioned at TTSH and SGH. Helicopter landing zone requested.' },
      { id: 'tl-0525-3', timestamp: '20 May 2026, 13:07', organisation: 'SCDF', actor: 'LTC Faridah', category: 'COORD', text: 'SGH, TTSH, and NUH placed on MCI protocol. All elective procedures suspended. 30 trauma beds cleared across 3 hospitals.' },
      { id: 'tl-0525-4', timestamp: '20 May 2026, 13:12', organisation: 'SCDF', actor: 'SSI Marcus Tan', category: 'MEDICAL', text: 'Triage station established trackside at km 14.2. METHANE report: M—multi-vehicle MCI; E—NSL tracks; T—train collision; H—18 casualties; A—access via Braddell Rd; N—SCDF IC; E—mass casualty.' },
      { id: 'tl-0525-5', timestamp: '20 May 2026, 13:15', organisation: 'MOI', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory: NSL service suspended Bishan to Newton. All platforms cleared. Alternative transport via bus 410.' },
      { id: 'tl-0525-6', timestamp: '20 May 2026, 13:22', organisation: 'St John Ambulance', actor: 'SJAB Team', category: 'COORD', text: '22 SJAB volunteers on scene providing P3 casualty first aid and stretcher bearer support.' },
      { id: 'tl-0525-7', timestamp: '20 May 2026, 13:30', organisation: 'SCDF', actor: 'COL David Loh', category: 'MEDICAL', text: '4 P1 patients transported to SGH trauma. Second transport wave in progress. 7 P2 being stabilised on scene.' },
      { id: 'tl-0525-8', timestamp: '20 May 2026, 14:00', organisation: 'SCDF', actor: 'LTC Faridah', category: 'STATUS', text: 'All 18 casualties accounted for. Extraction complete. Scene cleared for SMRT engineering team. IC transitioning to hospital coordination phase.' }
    ]
  },
  {
    id: 'INC-2026-0526',
    title: 'Island-wide Substation Failure — Tuas / Paya Lebar Grid',
    type: 'Infrastructure',
    severity: 'High',
    status: 'Contained',
    source: 'spf_feed',
    createdBy: 'spf',
    createdAt: '20 May 2026, 12:10 pm',
    location: 'Tuas South 400kV Substation + Paya Lebar Grid',
    zone: 'National',
    description: 'Cascading failure from Tuas South 400kV substation caused partial island-wide power disruption across 14 residential zones and 2 hospitals. 60% restored via rolling switching. 3 zones remain on backup power.',
    assignedOrganisations: ['scdf', 'spf', 'sgh'],
    respondingOrganisations: [{ organisation: 'SCDF', status: 'Lift rescue operations' }, { organisation: 'SP Group', status: 'Grid restoration ongoing' }, { organisation: 'EMA', status: 'Emergency protocol activated' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Public',
    unitsResponded: 12,
    volunteersResponded: 0,
    confidenceScore: 99,
    verifiedAt: '20 May 2026, 12:15',
    timeline: [
      { id: 'tl-0526-1', timestamp: '20 May 2026, 12:10', organisation: 'SP Group', actor: 'SP Group Ops', category: 'INITIAL', text: 'SP Group emergency alert: major grid disruption. Tuas South 400kV substation offline due to equipment failure.' },
      { id: 'tl-0526-2', timestamp: '20 May 2026, 12:15', organisation: 'SCDF', actor: 'SCDF Ops', category: 'ASSESS', text: 'Alexandra Hospital and Ng Teng Fong on backup generators. PUB reservoirs unaffected. SCDF lift rescue units activated for trapped persons.' },
      { id: 'tl-0526-3', timestamp: '20 May 2026, 12:18', organisation: 'EMA', actor: 'EMA Ops', category: 'COORD', text: 'EMA (Energy Market Authority) activated emergency protocol. Rolling restoration underway via Paya Lebar and Senoko switching.' },
      { id: 'tl-0526-4', timestamp: '20 May 2026, 12:25', organisation: 'SCDF', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory: do not use lifts. Report trapped persons to 995. Avoid driving in unlit areas.' },
      { id: 'tl-0526-5', timestamp: '20 May 2026, 13:45', organisation: 'SP Group', actor: 'SP Group Ops', category: 'STATUS', text: '60% of affected zones restored. 3 zones (Jurong West, Tampines North, Woodlands) still on rolling blackout. Full restoration targeted by 17:00.' }
    ]
  },
  {
    id: 'INC-2026-0527',
    title: 'Dengue Cluster — Woodlands Crescent',
    type: 'Medical',
    severity: 'Medium',
    status: 'Reported',
    source: 'hospital_feed',
    createdBy: 'hsa',
    createdAt: '20 May 2026, 02:05 pm',
    location: 'Woodlands Crescent Estate, Woodlands Drive 65 — Blk 201–208',
    zone: 'North',
    description: '14 confirmed dengue fever cases traced to Woodlands Crescent estate over 14 days. High Aedes aegypti breeding density confirmed by NEA survey. Environmental fogging and community outreach requested.',
    assignedOrganisations: ['hsa'],
    respondingOrganisations: [{ organisation: 'HSA / HPB', status: 'Contact tracing initiated' }, { organisation: 'NEA', status: 'Vector control requested' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 0,
    volunteersResponded: 0,
    confidenceScore: 82,
    timeline: [
      { id: 'tl-0527-1', timestamp: '20 May 2026, 14:05', organisation: 'HSA', actor: 'HPB Epidemiology', category: 'INITIAL', text: 'MOH dengue cluster alert flagged from polyclinic reports. 14 lab-confirmed dengue cases in last 14 days. Same postal code cluster.' },
      { id: 'tl-0527-2', timestamp: '20 May 2026, 14:07', organisation: 'NEA', actor: 'NEA Vector Control', category: 'NOTE', text: 'NEA contacted for targeted fogging at Blk 201–208 Woodlands Drive 65. Inspection team deployed. Case contact tracing initiated by HPB.' }
    ]
  },
  {
    id: 'INC-2026-0528',
    title: 'Suspicious Unattended Package — Raffles Place MRT',
    type: 'Civil',
    severity: 'Critical',
    status: 'Unverified',
    source: 'spf_feed',
    createdBy: 'spf',
    createdAt: '20 May 2026, 02:01 pm',
    location: 'Raffles Place MRT Exit B, Fullerton Road entrance',
    zone: 'Central',
    description: 'Unattended backpack left at Exit B for 45+ minutes. Station partially cordoned. SPF EOD team en route for assessment. Public notification pending verification. Confidence low — assessment ongoing.',
    assignedOrganisations: ['spf', 'scdf'],
    respondingOrganisations: [{ organisation: 'SPF EOD', status: 'En route' }, { organisation: 'SCDF', status: 'Standby' }],
    volunteerSupportNeeded: false,
    publicVisibility: 'Private',
    unitsResponded: 1,
    volunteersResponded: 0,
    confidenceScore: 45,
    timeline: [
      { id: 'tl-0528-1', timestamp: '20 May 2026, 14:01', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'MRT station staff reported unattended bag at Exit B, left for 45+ minutes. SPF alerted via 999 dispatch. Partial cordon placed.' },
      { id: 'tl-0528-2', timestamp: '20 May 2026, 14:03', organisation: 'SPF', actor: 'SPF EOD', category: 'NOTE', text: 'Confidence 45%. SPF EOD team dispatched, ETA 6 minutes. Staff advised not to move bag. Escalation to Critical pending EOD assessment.' }
    ]
  }
];

export const units: ResourceUnit[] = [
  { id: 'u-scdf-amb-01', callSign: 'SCDF-AMB-01', type: 'Ambulance', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0519' },
  { id: 'u-scdf-amb-02', callSign: 'SCDF-AMB-02', type: 'Ambulance', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0525' },
  { id: 'u-scdf-amb-03', callSign: 'SCDF-AMB-03', type: 'Ambulance', status: 'Available', organisation: 'SCDF' },
  { id: 'u-scdf-fe-01', callSign: 'SCDF-FE-01', type: 'Fire Engine', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
  { id: 'u-scdf-fe-02', callSign: 'SCDF-FE-02', type: 'Fire Engine', status: 'On Scene', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0523' },
  { id: 'u-scdf-fe-03', callSign: 'SCDF-FE-03', type: 'Fire Engine', status: 'Available', organisation: 'SCDF' },
  { id: 'u-scdf-boat-01', callSign: 'SCDF-BOAT-01', type: 'Boat', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
  { id: 'u-scdf-cert-01', callSign: 'SCDF-CERT-01', type: 'CERT Team', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
  { id: 'u-scdf-drn-01', callSign: 'SCDF-DRN-01', type: 'Drone', status: 'Engaged', organisation: 'SCDF', assignedIncidentId: 'INC-2026-0520' },
  { id: 'u-scdf-drn-02', callSign: 'SCDF-DRN-02', type: 'Drone', status: 'Available', organisation: 'SCDF' },
  { id: 'u-spf-p-01', callSign: 'SPF-P-01', type: 'Police', status: 'On Scene', organisation: 'SPF', assignedIncidentId: 'INC-2026-0520' },
  { id: 'u-spf-p-02', callSign: 'SPF-P-02', type: 'Police', status: 'En Route', organisation: 'SPF', assignedIncidentId: 'INC-2026-0528' },
  { id: 'u-spf-p-03', callSign: 'SPF-P-03', type: 'Police', status: 'Available', organisation: 'SPF' },
  { id: 'u-spf-p-04', callSign: 'SPF-P-04', type: 'Police', status: 'Engaged', organisation: 'SPF', assignedIncidentId: 'INC-2026-0525' },
  { id: 'u-sgh-mt-01', callSign: 'SGH-MT-01', type: 'Medical Team', status: 'Engaged', organisation: 'SGH', assignedIncidentId: 'INC-2026-0519' },
  { id: 'u-sgh-mt-02', callSign: 'SGH-MT-02', type: 'Medical Team', status: 'En Route', organisation: 'SGH', assignedIncidentId: 'INC-2026-0525' },
  { id: 'u-stjohn-mt-01', callSign: 'STJOHN-MT-01', type: 'Medical Team', status: 'Engaged', organisation: 'St John Ambulance', assignedIncidentId: 'INC-2026-0525' },
  { id: 'u-redcross-mt-01', callSign: 'REDCROSS-MT-01', type: 'Medical Team', status: 'Available', organisation: 'Singapore Red Cross' }
];

export const broadcasts: Broadcast[] = [
  { id: 'b1', title: 'Flood Alert — Orchard Area', severity: 'CRITICAL', audience: 'zone', zone: 'Central', message: 'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'Waves', linkedIncidentId: 'INC-2026-0520' },
  { id: 'b2', title: 'All Responders — Multi-Incident Standby', severity: 'NOTICE', audience: 'responders', message: 'Multiple simultaneous incidents across CBD. All units on standby for immediate deployment. MCI protocol active at SGH.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:50 pm', icon: 'Radio' },
  { id: 'b3', title: 'MRT Disruption — NSL and NSL-North', severity: 'NOTICE', audience: 'all', message: 'NSL service suspended between Bishan and Newton following emergency. Alternative bus services deployed. Check SMRT app.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 01:05 pm', icon: 'Train', linkedIncidentId: 'INC-2026-0525' },
  { id: 'b4', title: 'Power Disruption — 14 Zones Affected', severity: 'NOTICE', audience: 'all', message: 'Partial power outage affecting Jurong West, Tampines North, and 12 other zones. Do not use lifts. Call 995 if trapped.', issuer: 'Raj Kumar', timestamp: '20 May 2026, 12:25 pm', icon: 'ShieldAlert', linkedIncidentId: 'INC-2026-0526' },
  { id: 'b5', title: 'Volunteer Call — Medical Support NSL Incident', severity: 'INFO', audience: 'responders', message: 'Additional first-aid certified volunteers needed to support mass casualty response near Bishan MRT. Report to SJAB staging area.', issuer: 'Chen Xiao Ling', timestamp: '20 May 2026, 01:10 pm', icon: 'HeartPulse' }
];

export const volunteerTasks: VolunteerTask[] = [
  { id: 'vt1', title: 'Flood Relief — Emergency Food Packing', organisation: 'Singapore Red Cross', location: 'Jurong West Sports Centre', time: 'Today 10:00 AM - 2:00 PM', urgency: 'High', skills: ['Packing', 'Logistics', 'No prior experience'], slotsFilled: 18, slotsTotal: 30, status: 'Filling', description: 'Pack emergency ration kits for displaced residents at Jurong West evacuation centre.' },
  { id: 'vt2', title: 'Evacuation Centre — Registration Desk', organisation: 'SCDF Community Resilience', location: 'Clementi Community Club', time: 'Today 12:00 PM - 8:00 PM', urgency: 'Critical', skills: ['Registration', 'Crowd support'], slotsFilled: 4, slotsTotal: 10, status: 'Open', description: 'Assist residents with intake forms and queue guidance.' },
  { id: 'vt3', title: 'Language Support — Mandarin / Tamil', organisation: "People's Association", location: 'Multiple sites', time: 'Today - on call from 9 AM', urgency: 'High', skills: ['Mandarin', 'Tamil'], slotsFilled: 3, slotsTotal: 8, status: 'Open', description: 'Support multilingual guidance at community help desks.' },
  { id: 'vt4', title: 'First Aid Station Support', organisation: 'Singapore General Hospital', location: 'Jurong West Sports Centre - Medical Post B', time: 'Today 8:00 AM - 8:00 PM', urgency: 'Critical', skills: ['First Aid'], slotsFilled: 12, slotsTotal: 15, status: 'Filling', description: 'Support first aid station operations under medical supervision.' },
  { id: 'vt5', title: 'Emergency Supply Distribution', organisation: 'Singapore Civil Defence Force', location: 'Bukit Batok Community Centre', time: 'Tomorrow 9:00 AM - 5:00 PM', urgency: 'Medium', skills: ['Logistics'], slotsFilled: 7, slotsTotal: 20, status: 'Open', description: 'Distribute water, blankets, and emergency supplies.' },
  { id: 'vt6', title: 'Blood Donation Drive — Walk-in', organisation: 'Health Sciences Authority', location: 'HSA Bloodbank @ HSA, 11 Outram Rd', time: 'Today & Tomorrow 8:30 AM - 4:30 PM', urgency: 'High', skills: ['Walk-in'], slotsFilled: 143, slotsTotal: 200, status: 'Filling', description: 'Support increased blood donation intake and queue operations.' }
];

export const communityProgrammes: CommunityProgramme[] = [
  { id: 'cp1', title: 'Community Emergency Preparedness Workshop', organisation: 'Jurong West RC', location: 'Jurong West CC, Multi-Purpose Hall 1', time: 'Sat, 24 May - 9:00 AM - 12:00 PM', category: 'Preparedness', tags: ['First Aid', 'Preparedness', 'Free'], registered: 38, capacity: 60, description: 'Hands-on workshop covering first aid, evacuation readiness, and household emergency kits.', contact: 'jurongwest.rc@pa.gov.sg' },
  { id: 'cp2', title: 'Flood Relief Donation Drive', organisation: 'Singapore Red Cross', location: 'Clementi MRT Station Exit A', time: 'Today & Tomorrow - 9:00 AM - 9:00 PM', category: 'Relief', tags: ['Donations', 'Flood Relief', 'Walk-in'], registered: 94, capacity: 140, description: 'Collecting bottled water, ready-to-eat meals, hygiene kits, and blankets for affected families.', contact: 'relief@redcross.sg' },
  { id: 'cp3', title: 'Neighbourhood CPR and AED Training', organisation: 'St John Ambulance Brigade', location: 'Jurong East Community Hall', time: 'Sun, 25 May - 10:00 AM - 1:00 PM', category: 'Training', tags: ['CPR', 'AED', 'Certificate'], registered: 22, capacity: 40, description: 'Learn CPR fundamentals and how to use an AED during cardiac emergencies.', contact: 'training@stjohn.sg' },
  { id: 'cp4', title: 'Heat Safety Outreach Booth', organisation: "People's Association", location: 'Tampines Hub Atrium', time: 'Fri, 23 May - 11:00 AM - 5:00 PM', category: 'Awareness', tags: ['Heat Safety', 'Seniors', 'Free'], registered: 16, capacity: 50, description: 'Public outreach on heat injury prevention and checking in on vulnerable neighbours.', contact: 'care@pa.gov.sg' }
];

export const hospitals: Hospital[] = [
  { id: 'h1', name: 'Alexandra Hospital', address: '378 Alexandra Rd, Singapore 159964', availableBeds: 34, totalBeds: 330, icuAvailable: 2, traumaBays: 3, status: 'Critical', updatedAt: '02:01 pm' },
  { id: 'h2', name: 'Changi General Hospital', address: '2 Simei St 3, Singapore 529889', availableBeds: 134, totalBeds: 1000, icuAvailable: 11, traumaBays: 5, status: 'Limited', updatedAt: '02:00 pm' },
  { id: 'h3', name: 'Khoo Teck Puat Hospital', address: '90 Yishun Central, Singapore 768828', availableBeds: 90, totalBeds: 800, icuAvailable: 7, traumaBays: 4, status: 'Limited', updatedAt: '01:58 pm' },
  { id: 'h4', name: 'National University Hospital', address: '5 Lower Kent Ridge Rd, Singapore 119074', availableBeds: 167, totalBeds: 1200, icuAvailable: 14, traumaBays: 6, status: 'Limited', updatedAt: '01:55 pm' },
  { id: 'h5', name: 'Singapore General Hospital', address: 'Outram Rd, Singapore 169608', availableBeds: 89, totalBeds: 1785, icuAvailable: 8, traumaBays: 9, status: 'Critical', updatedAt: '02:03 pm' },
  { id: 'h6', name: 'Tan Tock Seng Hospital', address: '11 Jalan Tan Tock Seng, Singapore 308433', availableBeds: 240, totalBeds: 1415, icuAvailable: 18, traumaBays: 8, status: 'Normal', updatedAt: '01:50 pm' }
];

export const thresholds: ThresholdAlert[] = [
  { id: 't1', title: 'Open incidents threshold', current: 23, threshold: 10, status: 'Critical', recommendation: 'Activate multi-agency coordination centre and surge staffing' },
  { id: 't2', title: 'Critical severity threshold', current: 14, threshold: 5, status: 'Critical', recommendation: 'Deploy Red Cross support teams and activate national reserve' },
  { id: 't3', title: 'Hospital occupancy threshold', current: 91, threshold: 85, unit: '%', status: 'Critical', recommendation: 'Activate hospital surge protocol and standby beds' },
  { id: 't4', title: 'Infectious disease cases threshold', current: 44, threshold: 80, status: 'Normal', recommendation: 'Prepare vaccination rollout' },
  { id: 't5', title: 'Heat injury cases threshold', current: 31, threshold: 35, status: 'Warning', recommendation: 'Issue public health advisory and activate cooling centres' },
  { id: 't6', title: 'Flood reports threshold', current: 18, threshold: 12, status: 'Critical', recommendation: 'Create public broadcast for affected zones and pre-position pumps' }
];

export const notifications: NotificationItem[] = [
  { id: 'n1', type: 'assignment', text: 'Flash Flooding at Orchard Road assigned to your organisation', time: '2 min ago' },
  { id: 'n2', type: 'update', text: 'SPF marked traffic diversion active at Scotts Road', time: '8 min ago' },
  { id: 'n3', type: 'broadcast', text: 'Mass Casualty NSL incident — MCI protocol active at SGH', time: '14 min ago' }
];
