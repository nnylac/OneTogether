import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = (process.env['DATABASE_URL'] ?? 'file:./dev.db').replace(/^file:/, '');
const dbPath = path.isAbsolute(dbUrl) ? dbUrl : path.join(__dirname, '..', dbUrl);
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

// Map display names to org IDs for unit seeding
const unitOrgMap: Record<string, string> = {
  'SCDF': 'scdf',
  'SPF': 'spf',
  'SGH': 'sgh',
  'St John Ambulance': 'stjohn',
  'Singapore Red Cross': 'redcross',
};

async function main() {
  console.log('Seeding database...');

  await prisma.incidentParticipant.deleteMany();
  await prisma.resourceAssignment.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.incidentUpload.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.resourceUnit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organisation.deleteMany();

  // Organisations
  await prisma.organisation.createMany({
    data: [
      { id: 'scdf', name: 'Singapore Civil Defence Force', type: 'Government', address: 'Buona Vista Fire Station, 51 Buona Vista Rd', verified: true, volunteersAvailable: 18, volunteersTotal: 25, activeTasks: 0, status: 'deployed' },
      { id: 'spf', name: 'Singapore Police Force', type: 'Government', address: 'New Phoenix Park, 28 Irrawaddy Rd', verified: true, volunteersAvailable: 0, volunteersTotal: 0, activeTasks: 3, status: 'deployed' },
      { id: 'sgh', name: 'Singapore General Hospital', type: 'Healthcare', address: 'Outram Rd', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'active' },
      { id: 'redcross', name: 'Singapore Red Cross - Jurong Chapter', type: 'NGO', address: 'Jurong West Sports Centre, 20 Jurong West St 93', verified: true, volunteersAvailable: 32, volunteersTotal: 48, activeTasks: 2, status: 'deployed' },
      { id: 'pa-jurong', name: "People's Association - Jurong West Volunteers", type: 'Grassroots', address: 'Jurong West Community Club, 20 Jurong West St 61', verified: true, volunteersAvailable: 85, volunteersTotal: 120, activeTasks: 1, status: 'active' },
      { id: 'stjohn', name: 'St John Ambulance Brigade - Jurong Unit', type: 'Healthcare', address: 'Jurong East MRT Station', verified: true, volunteersAvailable: 22, volunteersTotal: 35, activeTasks: 1, status: 'deployed' },
      { id: 'tampines-cc', name: 'Tampines North Community Club - CARE Network', type: 'Grassroots', address: '10 Tampines St 91', verified: true, volunteersAvailable: 60, volunteersTotal: 95, activeTasks: 0, status: 'active' },
      { id: 'hsa', name: 'Health Sciences Authority', type: 'Government', address: '11 Outram Rd', verified: true, volunteersAvailable: 78, volunteersTotal: 245, activeTasks: 1, status: 'active' },
    ],
  });

  // Users (passwordHash is a placeholder for demo)
  await prisma.user.createMany({
    data: [
      { id: 'u-citizen', name: 'Amira Tan', email: 'citizen@onetogether.sg', role: 'citizen' },
      { id: 'u-org', name: 'Chen Xiao Ling', email: 'scdf@onetogether.sg', role: 'organisation', organisationId: 'scdf' },
      { id: 'u-gov', name: 'Raj Kumar', email: 'raj.kumar@gov.sg', role: 'government' },
    ],
  });

  // Resource units
  const unitData = [
    { id: 'u-scdf-amb-01', callSign: 'SCDF-AMB-01', type: 'Ambulance', status: 'On Scene', organisationId: 'scdf' },
    { id: 'u-scdf-amb-02', callSign: 'SCDF-AMB-02', type: 'Ambulance', status: 'Engaged', organisationId: 'scdf' },
    { id: 'u-scdf-amb-03', callSign: 'SCDF-AMB-03', type: 'Ambulance', status: 'Available', organisationId: 'scdf' },
    { id: 'u-scdf-fe-01', callSign: 'SCDF-FE-01', type: 'Fire Engine', status: 'Engaged', organisationId: 'scdf' },
    { id: 'u-scdf-fe-02', callSign: 'SCDF-FE-02', type: 'Fire Engine', status: 'On Scene', organisationId: 'scdf' },
    { id: 'u-scdf-fe-03', callSign: 'SCDF-FE-03', type: 'Fire Engine', status: 'Available', organisationId: 'scdf' },
    { id: 'u-scdf-boat-01', callSign: 'SCDF-BOAT-01', type: 'Boat', status: 'Engaged', organisationId: 'scdf' },
    { id: 'u-scdf-cert-01', callSign: 'SCDF-CERT-01', type: 'CERT Team', status: 'Engaged', organisationId: 'scdf' },
    { id: 'u-scdf-drn-01', callSign: 'SCDF-DRN-01', type: 'Drone', status: 'Engaged', organisationId: 'scdf' },
    { id: 'u-scdf-drn-02', callSign: 'SCDF-DRN-02', type: 'Drone', status: 'Available', organisationId: 'scdf' },
    { id: 'u-spf-p-01', callSign: 'SPF-P-01', type: 'Police', status: 'On Scene', organisationId: 'spf' },
    { id: 'u-spf-p-02', callSign: 'SPF-P-02', type: 'Police', status: 'En Route', organisationId: 'spf' },
    { id: 'u-spf-p-03', callSign: 'SPF-P-03', type: 'Police', status: 'Available', organisationId: 'spf' },
    { id: 'u-spf-p-04', callSign: 'SPF-P-04', type: 'Police', status: 'Engaged', organisationId: 'spf' },
    { id: 'u-sgh-mt-01', callSign: 'SGH-MT-01', type: 'Medical Team', status: 'Engaged', organisationId: 'sgh' },
    { id: 'u-sgh-mt-02', callSign: 'SGH-MT-02', type: 'Medical Team', status: 'En Route', organisationId: 'sgh' },
    { id: 'u-stjohn-mt-01', callSign: 'STJOHN-MT-01', type: 'Medical Team', status: 'Engaged', organisationId: 'stjohn' },
    { id: 'u-redcross-mt-01', callSign: 'REDCROSS-MT-01', type: 'Medical Team', status: 'Available', organisationId: 'redcross' },
  ];
  await prisma.resourceUnit.createMany({ data: unitData });

  // Incidents
  const incidents = [
    {
      id: 'INC-2026-0519',
      title: 'Cardiac Arrest at Orchard MRT',
      type: 'Medical', severity: 'Critical', status: 'On Scene',
      createdBy: 'scdf', location: 'Orchard MRT Exit B', zone: 'Central',
      description: 'Unconscious commuter, male, approx 55 years. AED deployed by station staff before SCDF arrival. Paramedic team on scene. Patient stabilised for transport.',
      assignedOrgIds: JSON.stringify(['scdf', 'sgh']),
      publicVisibility: 'Private',
      confidenceScore: 95,
      incidentCommander: 'Chen Xiao Ling',
    },
    {
      id: 'INC-2026-0520',
      title: 'Flash Flooding — Orchard / Scotts Road',
      type: 'Flood', severity: 'Critical', status: 'On Scene',
      createdBy: 'scdf', location: 'Orchard Road / Scotts Road underpass', zone: 'Central',
      description: 'Flash flooding affecting pedestrian underpasses, low-lying roads, and retail basement levels. 2 vehicles swept. Water level 45cm at Scotts Road underpass. Pumping operations active.',
      assignedOrgIds: JSON.stringify(['scdf', 'spf', 'redcross']),
      publicVisibility: 'Public',
      confidenceScore: 99,
      incidentCommander: 'Maj Rahman Bin Ismail',
    },
    {
      id: 'INC-2026-0521',
      title: 'Construction Site Fall Injury — Marina Bay',
      type: 'Medical', severity: 'High', status: 'Dispatched',
      createdBy: 'sgh', location: 'Marina Bay Sands construction annex, Bay Front Ave', zone: 'Central',
      description: 'Worker fall from scaffolding at level 4. Suspected spinal injury. SCDF-AMB-02 dispatched. SGH trauma bay reserved.',
      assignedOrgIds: JSON.stringify(['sgh', 'scdf']),
      publicVisibility: 'Private',
      confidenceScore: 88,
    },
    {
      id: 'INC-2026-0522',
      title: 'MRT Power Fault — North-South Line',
      type: 'Infrastructure', severity: 'High', status: 'Verified',
      createdBy: 'spf', location: 'North-South Line — Bishan to Orchard segment', zone: 'North',
      description: 'Power fault causing service suspension and station overcrowding. Bridging bus services deployed. SMRT estimating 45-minute recovery window.',
      assignedOrgIds: JSON.stringify(['spf']),
      publicVisibility: 'Public',
      confidenceScore: 80,
    },
    {
      id: 'INC-2026-0523',
      title: 'Partial Building Collapse — Toa Payoh HDB',
      type: 'Infrastructure', severity: 'Critical', status: 'On Scene',
      createdBy: 'scdf', location: 'Blk 93 Toa Payoh Lorong 4, #05-120', zone: 'Central',
      description: 'Partial collapse of corridor slab at Blk 93 Toa Payoh during HIP renovation works. 3 persons initially reported trapped. USAR team on scene. Structural assessment ongoing.',
      assignedOrgIds: JSON.stringify(['scdf', 'sgh', 'spf']),
      publicVisibility: 'Private',
      confidenceScore: 97,
      incidentCommander: 'Mdm Lim Bee Hoon',
    },
    {
      id: 'INC-2026-0524',
      title: 'Industrial Chemical Spill — Jurong Chemical Park',
      type: 'Infrastructure', severity: 'High', status: 'Dispatched',
      createdBy: 'scdf', location: 'Jurong Chemical Park, 100 Jurong Island Hwy — Bay 7', zone: 'West',
      description: 'Sodium hydroxide (NaOH) spill from ruptured 1000L IBC tank at processing facility Bay 7. 3 workers with chemical burns. Facility evacuation of adjacent units initiated. SCDF HazMat team en route.',
      assignedOrgIds: JSON.stringify(['scdf', 'spf']),
      publicVisibility: 'Private',
      confidenceScore: 91,
    },
    {
      id: 'INC-2026-0525',
      title: 'Mass Casualty — NSL Train Collision Bishan',
      type: 'Medical', severity: 'Critical', status: 'On Scene',
      createdBy: 'scdf', location: 'NSL between Bishan and Braddell MRT stations', zone: 'Central',
      description: 'Two-train low-speed collision on North-South Line between Bishan and Braddell. Initial report: 18 casualties across 2 trains. 4 P1 (critical), 7 P2, 7 P3. Mass casualty protocol activated. Trains halted trackside, patient extraction ongoing.',
      assignedOrgIds: JSON.stringify(['scdf', 'sgh', 'spf', 'stjohn']),
      publicVisibility: 'Public',
      confidenceScore: 99,
      incidentCommander: 'COL (SCDF) David Loh',
    },
    {
      id: 'INC-2026-0526',
      title: 'Island-wide Substation Failure — Tuas / Paya Lebar Grid',
      type: 'Infrastructure', severity: 'High', status: 'Contained',
      createdBy: 'spf', location: 'Tuas South 400kV Substation + Paya Lebar Grid', zone: 'National',
      description: 'Cascading failure from Tuas South 400kV substation caused partial island-wide power disruption across 14 residential zones and 2 hospitals. 60% restored via rolling switching. 3 zones remain on backup power.',
      assignedOrgIds: JSON.stringify(['scdf', 'spf', 'sgh']),
      publicVisibility: 'Public',
      confidenceScore: 99,
    },
    {
      id: 'INC-2026-0527',
      title: 'Dengue Cluster — Woodlands Crescent',
      type: 'Medical', severity: 'Medium', status: 'Reported',
      createdBy: 'hsa', location: 'Woodlands Crescent Estate, Woodlands Drive 65 — Blk 201–208', zone: 'North',
      description: '14 confirmed dengue fever cases traced to Woodlands Crescent estate over 14 days. High Aedes aegypti breeding density confirmed by NEA survey. Environmental fogging and community outreach requested.',
      assignedOrgIds: JSON.stringify(['hsa']),
      publicVisibility: 'Private',
      confidenceScore: 82,
    },
    {
      id: 'INC-2026-0528',
      title: 'Suspicious Unattended Package — Raffles Place MRT',
      type: 'Civil', severity: 'Critical', status: 'Unverified',
      createdBy: 'spf', location: 'Raffles Place MRT Exit B, Fullerton Road entrance', zone: 'Central',
      description: 'Unattended backpack left at Exit B for 45+ minutes. Station partially cordoned. SPF EOD team en route for assessment. Public notification pending verification.',
      assignedOrgIds: JSON.stringify(['spf', 'scdf']),
      publicVisibility: 'Private',
      confidenceScore: 45,
    },
  ];

  for (const inc of incidents) {
    await prisma.incident.create({ data: inc });
  }

  // Timeline events
  const timelineData = [
    { incidentId: 'INC-2026-0519', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Case opened from 995 dispatch feed. AED deployed by station staff confirmed.' },
    { incidentId: 'INC-2026-0519', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 95%. Status advanced to Verified.' },
    { incidentId: 'INC-2026-0519', organisation: 'SCDF', actor: 'SCDF-AMB-01 Crew', category: 'DEPLOY', text: 'SCDF-AMB-01 arrived Orchard MRT Exit B. Patient unconscious, CPR in progress by station staff.' },
    { incidentId: 'INC-2026-0519', organisation: 'SCDF', actor: 'SSI Rahman', category: 'MEDICAL', text: 'Paramedic team on scene. AED shock administered x2. ROSC achieved. Patient stabilised for transport to SGH.' },

    { incidentId: 'INC-2026-0520', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'INITIAL', text: 'Flash flooding reported at Orchard Road / Scotts Road underpass. Multiple 995 calls received. NEA heavy rainfall advisory in effect.' },
    { incidentId: 'INC-2026-0520', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'DEPLOY', text: 'Pumping team, SCDF-BOAT-01, CERT-01, and 3 flood response units dispatched. SCDF-FE-01 pre-positioned.' },
    { incidentId: 'INC-2026-0520', organisation: 'SCDF', actor: 'Raj Kumar', category: 'BROADCAST', text: 'Public advisory issued. Residents advised to avoid low-lying areas in Orchard zone. Gov.sg alert sent.' },
    { incidentId: 'INC-2026-0520', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'Traffic diversion activated at Scotts Road junction. Lane closures at 4 intersections. No pedestrian casualties.' },
    { incidentId: 'INC-2026-0520', organisation: 'SCDF', actor: 'SI Tan Wei Jie', category: 'ASSESS', text: 'Flood level at Scotts Road underpass: 45cm. 2 vehicles partially submerged. No persons trapped. Pumps operational.' },
    { incidentId: 'INC-2026-0520', organisation: 'PUB', actor: 'PUB Ops', category: 'COORD', text: 'PUB activated drainage pumps at Somerset canal. Water levels expected to recede by 16:00 hrs.' },

    { incidentId: 'INC-2026-0521', organisation: 'SGH', actor: 'SGH Trauma Coordinator', category: 'INITIAL', text: 'Trauma ticket created via hospital source system. Worker fall from scaffolding level 4. Trauma bay reserved.' },
    { incidentId: 'INC-2026-0521', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'STATUS', text: 'Incident verified. Confidence 88%. SCDF-AMB-02 dispatched, ETA 8 minutes.' },

    { incidentId: 'INC-2026-0522', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'Power fault on North-South Line confirmed via SMRT ops feed. Station crowding reported at Bishan, Toa Payoh, Novena.' },
    { incidentId: 'INC-2026-0522', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'COORD', text: 'SPF crowd control officers deployed to Bishan, Toa Payoh, Novena stations. SMRT bridging buses activated.' },
    { incidentId: 'INC-2026-0522', organisation: 'SCDF', actor: 'Chen Xiao Ling', category: 'ASSESS', text: 'Incident verified. Power engineering fault, not structural. SPF managing crowd. SMRT estimating 45-min recovery.' },

    { incidentId: 'INC-2026-0525', organisation: 'SCDF', actor: 'SCDF Ops Centre', category: 'INITIAL', text: '995 mass alert: 2-train collision on NSL. Mass casualty protocol activated. All available AMB units and CERT teams redirected.' },
    { incidentId: 'INC-2026-0525', organisation: 'SCDF', actor: 'COL David Loh', category: 'DEPLOY', text: 'SCDF-AMB-01, 02, 03 + 2 CERT teams dispatched. SCDF-AMB-04, 05 pre-positioned at TTSH and SGH. Helicopter landing zone requested.' },
    { incidentId: 'INC-2026-0525', organisation: 'SCDF', actor: 'LTC Faridah', category: 'COORD', text: 'SGH, TTSH, and NUH placed on MCI protocol. All elective procedures suspended. 30 trauma beds cleared across 3 hospitals.' },
    { incidentId: 'INC-2026-0525', organisation: 'SCDF', actor: 'SSI Marcus Tan', category: 'MEDICAL', text: 'Triage station established trackside at km 14.2. METHANE report filed.' },
    { incidentId: 'INC-2026-0525', organisation: 'St John Ambulance', actor: 'SJAB Team', category: 'COORD', text: '22 SJAB volunteers on scene providing P3 casualty first aid and stretcher bearer support.' },

    { incidentId: 'INC-2026-0526', organisation: 'SP Group', actor: 'SP Group Ops', category: 'INITIAL', text: 'SP Group emergency alert: major grid disruption. Tuas South 400kV substation offline due to equipment failure.' },
    { incidentId: 'INC-2026-0526', organisation: 'SCDF', actor: 'SCDF Ops', category: 'ASSESS', text: 'Alexandra Hospital and Ng Teng Fong on backup generators. PUB reservoirs unaffected. SCDF lift rescue units activated.' },

    { incidentId: 'INC-2026-0527', organisation: 'HSA', actor: 'HPB Epidemiology', category: 'INITIAL', text: 'MOH dengue cluster alert flagged from polyclinic reports. 14 lab-confirmed dengue cases in last 14 days.' },

    { incidentId: 'INC-2026-0528', organisation: 'SPF', actor: 'SPF Duty Officer', category: 'INITIAL', text: 'MRT station staff reported unattended bag at Exit B, left for 45+ minutes. SPF alerted via 999 dispatch.' },
    { incidentId: 'INC-2026-0528', organisation: 'SPF', actor: 'SPF EOD', category: 'NOTE', text: 'Confidence 45%. SPF EOD team dispatched, ETA 6 minutes.' },
  ];

  await prisma.timelineEvent.createMany({ data: timelineData });

  // Resource assignments for units that have assignedIncidentId
  const assignments = [
    { incidentId: 'INC-2026-0519', unitId: 'u-scdf-amb-01', status: 'On Scene' },
    { incidentId: 'INC-2026-0525', unitId: 'u-scdf-amb-02', status: 'Engaged' },
    { incidentId: 'INC-2026-0520', unitId: 'u-scdf-fe-01', status: 'Engaged' },
    { incidentId: 'INC-2026-0523', unitId: 'u-scdf-fe-02', status: 'On Scene' },
    { incidentId: 'INC-2026-0520', unitId: 'u-scdf-boat-01', status: 'Engaged' },
    { incidentId: 'INC-2026-0520', unitId: 'u-scdf-cert-01', status: 'Engaged' },
    { incidentId: 'INC-2026-0520', unitId: 'u-scdf-drn-01', status: 'Engaged' },
    { incidentId: 'INC-2026-0520', unitId: 'u-spf-p-01', status: 'On Scene' },
    { incidentId: 'INC-2026-0528', unitId: 'u-spf-p-02', status: 'En Route' },
    { incidentId: 'INC-2026-0525', unitId: 'u-spf-p-04', status: 'Engaged' },
    { incidentId: 'INC-2026-0519', unitId: 'u-sgh-mt-01', status: 'Engaged' },
    { incidentId: 'INC-2026-0525', unitId: 'u-sgh-mt-02', status: 'En Route' },
    { incidentId: 'INC-2026-0525', unitId: 'u-stjohn-mt-01', status: 'Engaged' },
  ];

  await prisma.resourceAssignment.createMany({ data: assignments });

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
