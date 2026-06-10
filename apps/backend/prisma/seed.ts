import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../generated/prisma/client';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL env var is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type OrganisationContactGuide = {
  orgName: string;
  contactNumber: string | null;
  contactChannel: string;
  serviceSummary: string;
  contactGuidance: string;
};

type SeedBroadcastAudience =
  | { audience_type: 'public' }
  | { audience_type: 'region'; region: string }
  | { audience_type: 'organisation'; organisation_id: string };

type SeedBroadcast = {
  id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: Date;
  audiences: SeedBroadcastAudience[];
};

const organisationContactGuides: OrganisationContactGuide[] = [
  {
    orgName: 'SPF',
    contactNumber: '999',
    contactChannel: 'Emergency hotline',
    serviceSummary:
      'Police response for crime, public order, suspicious activity, and immediate security threats.',
    contactGuidance:
      'Call 999 for police emergencies or urgent security threats. For non-urgent matters, use SPF public reporting channels.',
  },
  {
    orgName: 'SCDF',
    contactNumber: '995',
    contactChannel: 'Emergency hotline',
    serviceSummary:
      'Fire, rescue, ambulance, hazardous material, and emergency medical response.',
    contactGuidance:
      'Call 995 for life-threatening medical emergencies, fire, rescue, or hazardous material incidents.',
  },
  {
    orgName: 'MOH',
    contactNumber: '6325 9220',
    contactChannel: 'General hotline',
    serviceSummary:
      'National health guidance, public health advisories, disease information, and healthcare policy support.',
    contactGuidance:
      'Contact MOH for general health guidance, disease advisories, and ministry-level healthcare enquiries.',
  },
  {
    orgName: 'SGH',
    contactNumber: '6222 3322',
    contactChannel: 'Hospital hotline',
    serviceSummary:
      'Singapore General Hospital services including specialist care, appointments, and hospital enquiries.',
    contactGuidance:
      'Contact SGH for hospital services, appointment guidance, and patient-related enquiries.',
  },
  {
    orgName: 'PUB',
    contactNumber: '6521 6470',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'National water agency handling drainage, flood management, water supply, and sewerage issues.',
    contactGuidance:
      'Contact PUB for drainage issues, flooding, water supply disruptions, or sewerage-related matters.',
  },
  {
    orgName: 'NEA',
    contactNumber: '6225 5632',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Environmental public health, pollution, sanitation, hawker centre matters, and weather-related advisories.',
    contactGuidance:
      'Contact NEA for environmental health, pollution, cleanliness, vector, or weather advisory matters.',
  },
  {
    orgName: 'LTA',
    contactNumber: '6225 5582',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Land transport operations, road issues, public transport disruptions, and traffic management.',
    contactGuidance:
      'Contact LTA for road, traffic, and public transport service disruptions or transport infrastructure concerns.',
  },
  {
    orgName: 'HDB',
    contactNumber: '6225 5432',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Public housing estate matters, town living support, HDB flats, and residential property services.',
    contactGuidance:
      'Contact HDB for public housing, estate facilities, and flat-related enquiries.',
  },
  {
    orgName: 'EMA',
    contactNumber: '6835 8000',
    contactChannel: 'Agency hotline',
    serviceSummary:
      'Energy market, electricity and gas supply reliability, and power-sector coordination.',
    contactGuidance:
      'Contact EMA for electricity, gas, and power-sector matters. For immediate danger from electrical hazards, call emergency services.',
  },
  {
    orgName: 'SINGHEALTH',
    contactNumber: '6377 8791',
    contactChannel: 'Healthcare cluster hotline',
    serviceSummary:
      'Public healthcare cluster covering hospitals, polyclinics, national specialty centres, and community care services.',
    contactGuidance:
      'Contact SingHealth for cluster healthcare services, appointments, and care navigation.',
  },
  {
    orgName: 'NUHS',
    contactNumber: '6908 2222',
    contactChannel: 'Healthcare cluster hotline',
    serviceSummary:
      'Public healthcare cluster supporting hospital, national specialty, polyclinic, and academic health services.',
    contactGuidance:
      'Contact NUHS for cluster healthcare services, appointments, and care navigation.',
  },
  {
    orgName: 'TOWN_COUNCIL',
    contactNumber: null,
    contactChannel: 'OneService App',
    serviceSummary:
      'Municipal estate support for neighbourhood maintenance, cleanliness, facilities, and local defects.',
    contactGuidance:
      'Use the OneService App for municipal estate issues such as cleanliness, lighting, defects, and neighbourhood maintenance.',
  },
];

// Shared easy password for all demo accounts (demo/testing only).
const DEMO_PASSWORD = 'password123';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const iterations = 210000;
  const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${key.toString('base64url')}`;
}

async function main() {
  console.log('Seeding database...\n');

  // --- Organisations ---
  const scdf = await prisma.organisations.upsert({
    where: { org_name: 'SCDF' },
    update: {},
    create: { org_name: 'SCDF' },
  });

  const spf = await prisma.organisations.upsert({
    where: { org_name: 'SPF' },
    update: {},
    create: { org_name: 'SPF' },
  });

  const sgh = await prisma.organisations.upsert({
    where: { org_name: 'SGH' },
    update: {},
    create: { org_name: 'SGH' },
  });

  await prisma.organisations.upsert({
    where: { org_name: 'MOH' },
    update: {},
    create: { org_name: 'MOH' },
  });

  await prisma.organisations.upsert({
    where: { org_name: 'IMDA' },
    update: {},
    create: { org_name: 'IMDA' },
  });

  await seedOrganisationContactGuides();

  console.log('Organisations: SCDF, SPF, SGH, MOH, IMDA, and public guides');

  // --- Citizen (role: user) ---
  const citizenFields = {
    email: 'citizen@onetogether.sg',
    first_name: 'Demo',
    last_name: 'Citizen',
    role: 'user',
    is_verified: true,
  };
  const citizenUser = await prisma.users.upsert({
    where: { username: 'citizen' },
    update: citizenFields,
    create: { username: 'citizen', ...citizenFields },
  });

  await prisma.accounts.upsert({
    where: { user_id: citizenUser.id },
    update: { password_hash: hashPassword(DEMO_PASSWORD) },
    create: {
      user_id: citizenUser.id,
      password_hash: hashPassword(DEMO_PASSWORD),
    },
  });

  console.log(
    'User created:   citizen@onetogether.sg / password123 → /citizen',
  );

  // --- Responder (role: responder, org: SCDF) ---
  const responderFields = {
    email: 'responder@scdf.sg',
    first_name: 'SCDF',
    last_name: 'Responder',
    role: 'responder',
    is_verified: true,
    user_organisation_id: scdf.id,
  };
  const responderUser = await prisma.users.upsert({
    where: { username: 'responder' },
    update: responderFields,
    create: { username: 'responder', ...responderFields },
  });

  await prisma.accounts.upsert({
    where: { user_id: responderUser.id },
    update: { password_hash: hashPassword(DEMO_PASSWORD) },
    create: {
      user_id: responderUser.id,
      password_hash: hashPassword(DEMO_PASSWORD),
    },
  });

  await prisma.user_organisations.upsert({
    where: {
      user_id_organisation_id: {
        user_id: responderUser.id,
        organisation_id: scdf.id,
      },
    },
    update: {},
    create: { user_id: responderUser.id, organisation_id: scdf.id },
  });

  console.log('User created:   responder@scdf.sg / password123 → /responder');

  // --- Responder 2 (SPF) ---
  const spfResponderFields = {
    email: 'officer@spf.sg',
    first_name: 'SPF',
    last_name: 'Officer',
    role: 'responder',
    is_verified: true,
    user_organisation_id: spf.id,
  };
  const spfResponder = await prisma.users.upsert({
    where: { username: 'spf.responder' },
    update: spfResponderFields,
    create: { username: 'spf.responder', ...spfResponderFields },
  });

  await prisma.accounts.upsert({
    where: { user_id: spfResponder.id },
    update: { password_hash: hashPassword(DEMO_PASSWORD) },
    create: {
      user_id: spfResponder.id,
      password_hash: hashPassword(DEMO_PASSWORD),
    },
  });

  await prisma.user_organisations.upsert({
    where: {
      user_id_organisation_id: {
        user_id: spfResponder.id,
        organisation_id: spf.id,
      },
    },
    update: {},
    create: { user_id: spfResponder.id, organisation_id: spf.id },
  });

  console.log('User created:   officer@spf.sg / password123 → /responder');

  // --- Hospital coordinator (role: responder, org: SGH) ---
  const hospitalFields = {
    email: 'doctor@hospital.sg',
    first_name: 'Hospital',
    last_name: 'Coordinator',
    role: 'responder',
    is_verified: true,
    user_organisation_id: sgh.id,
  };
  const hospitalUser = await prisma.users.upsert({
    where: { username: 'hospital' },
    update: hospitalFields,
    create: { username: 'hospital', ...hospitalFields },
  });

  await prisma.accounts.upsert({
    where: { user_id: hospitalUser.id },
    update: { password_hash: hashPassword(DEMO_PASSWORD) },
    create: {
      user_id: hospitalUser.id,
      password_hash: hashPassword(DEMO_PASSWORD),
    },
  });

  await prisma.user_organisations.upsert({
    where: {
      user_id_organisation_id: {
        user_id: hospitalUser.id,
        organisation_id: sgh.id,
      },
    },
    update: {},
    create: { user_id: hospitalUser.id, organisation_id: sgh.id },
  });

  console.log('User created:   doctor@hospital.sg / password123 → /responder');

  // --- Government (role: admin) ---
  const govFields = {
    email: 'admin@gov.sg',
    first_name: 'Demo',
    last_name: 'Government',
    role: 'admin',
    is_verified: true,
  };
  const govUser = await prisma.users.upsert({
    where: { username: 'gov' },
    update: govFields,
    create: { username: 'gov', ...govFields },
  });

  await prisma.accounts.upsert({
    where: { user_id: govUser.id },
    update: { password_hash: hashPassword(DEMO_PASSWORD) },
    create: {
      user_id: govUser.id,
      password_hash: hashPassword(DEMO_PASSWORD),
    },
  });

  console.log('User created:   admin@gov.sg / password123 → /government');

  await seedBroadcasts({
    govUserId: govUser.id,
    scdfOrganisationId: scdf.id,
    spfOrganisationId: spf.id,
  });

  console.log('Broadcasts:     seeded published demo broadcasts');

  await seedCommunityEvents();

  console.log('Community:      seeded demo community events');

  await seedGovernmentAlertRules();

  console.log('Alert rules:    seeded demo government alert rules');

  // --- Resource inventory ---
  // Mirrors the shape the agency simulators emit (apps/external/agencies/*/main.py)
  // so the responder Resources view has data without the Python sims running.
  // In production the sims are not deployed and the poller can't reach
  // localhost:810x, so these seeded rows are what the page renders.
  await seedResources();

  console.log('\nSeed complete.');
}

async function seedOrganisationContactGuides() {
  for (const guide of organisationContactGuides) {
    const data = {
      contact_number: guide.contactNumber,
      contact_channel: guide.contactChannel,
      service_summary: guide.serviceSummary,
      contact_guidance: guide.contactGuidance,
    };

    await prisma.organisations.upsert({
      where: { org_name: guide.orgName },
      update: data,
      create: {
        org_name: guide.orgName,
        ...data,
      },
    });
  }
}

type SeedCommunityEvent = {
  id: string;
  title: string;
  organiser_name: string;
  category: string;
  description: string;
  location: string;
  region: string;
  start_at: Date;
  end_at: Date;
  capacity: number;
  registered_count: number;
  is_free: boolean;
  signup_url: string;
};

async function seedCommunityEvents() {
  const demoEvents: SeedCommunityEvent[] = [
    {
      id: '51000000-0000-0000-0000-000000000001',
      title: 'Community Emergency Preparedness Workshop',
      organiser_name: 'Jurong West RC',
      category: 'preparedness',
      description:
        'Hands-on session on home fire safety, evacuation planning, and basic first aid. Tags: first aid, safety, preparedness.',
      location: 'Jurong West Community Club',
      region: 'West',
      start_at: new Date('2026-06-18T10:00:00+08:00'),
      end_at: new Date('2026-06-18T12:30:00+08:00'),
      capacity: 60,
      registered_count: 38,
      is_free: true,
      signup_url: 'https://onetogether.sg/community/preparedness-workshop',
    },
    {
      id: '51000000-0000-0000-0000-000000000002',
      title: 'Flood Relief Volunteer Drive',
      organiser_name: 'Singapore Red Cross',
      category: 'relief',
      description:
        'Support affected households with cleanup, supplies distribution, and welfare checks. Tags: relief, volunteering, community.',
      location: 'Bedok Reservoir Community Centre',
      region: 'East',
      start_at: new Date('2026-06-22T08:00:00+08:00'),
      end_at: new Date('2026-06-22T16:00:00+08:00'),
      capacity: 100,
      registered_count: 45,
      is_free: true,
      signup_url: 'https://onetogether.sg/community/flood-relief-drive',
    },
    {
      id: '51000000-0000-0000-0000-000000000003',
      title: 'Certified First Aid Training Course',
      organiser_name: 'SCDF Community Engagement',
      category: 'training',
      description:
        'Certified first aid and AED training with practical assessment. Tags: certification, training, medical.',
      location: 'Central Fire Station',
      region: 'Central',
      start_at: new Date('2026-06-27T14:00:00+08:00'),
      end_at: new Date('2026-06-27T17:00:00+08:00'),
      capacity: 30,
      registered_count: 28,
      is_free: false,
      signup_url: 'https://onetogether.sg/community/first-aid-training',
    },
    {
      id: '51000000-0000-0000-0000-000000000004',
      title: 'Neighbourhood Emergency Response (CERT) Volunteer Sign-up',
      organiser_name: 'SCDF Community Emergency Response Team',
      category: 'volunteer',
      description:
        'Join your neighbourhood CERT to support evacuation, first response, and welfare checks during emergencies. Includes orientation and hands-on drills. Tags: CERT, volunteering, response.',
      location: 'Tampines North Community Club',
      region: 'East',
      start_at: new Date('2026-07-05T09:00:00+08:00'),
      end_at: new Date('2026-07-05T13:00:00+08:00'),
      capacity: 80,
      registered_count: 31,
      is_free: true,
      signup_url: 'https://onetogether.sg/community/cert-volunteer-signup',
    },
  ];

  for (const event of demoEvents) {
    const { id, ...fields } = event;
    await prisma.community_events.upsert({
      where: { id },
      update: { ...fields, event_status: 'open' },
      create: { id, ...fields, event_status: 'open' },
    });
  }
}

type SeedGovernmentAlertRule = {
  id: string;
  name: string;
  metric: string;
  threshold_value: number;
  condition: string;
  unit: string;
  notification_message: string;
};

async function seedGovernmentAlertRules() {
  const demoRules: SeedGovernmentAlertRule[] = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      name: 'Open Incidents Surge',
      metric: 'openIncidents',
      threshold_value: 10,
      condition: 'above',
      unit: 'count',
      notification_message:
        'Open incident count has exceeded the safe coordination threshold. Review command allocation.',
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      name: 'Hospital Occupancy Critical',
      metric: 'hospitalOccupancy',
      threshold_value: 85,
      condition: 'above',
      unit: 'percent',
      notification_message:
        'Hospital bed occupancy is critically high. Activate surge and load-balancing protocols.',
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      name: 'Critical Incidents Watch',
      metric: 'criticalIncidents',
      threshold_value: 5,
      condition: 'above',
      unit: 'count',
      notification_message:
        'Multiple critical incidents detected. Consider escalating to unified command.',
    },
  ];

  for (const rule of demoRules) {
    const { id, ...fields } = rule;
    await prisma.government_alert_rules.upsert({
      where: { id },
      update: { ...fields, is_enabled: true },
      create: { id, ...fields, is_enabled: true },
    });
  }
}

async function seedBroadcasts({
  govUserId,
  scdfOrganisationId,
  spfOrganisationId,
}: {
  govUserId: string;
  scdfOrganisationId: string;
  spfOrganisationId: string;
}) {
  const demoBroadcasts: SeedBroadcast[] = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      title: 'Flood Alert - Orchard Area',
      message:
        'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.',
      severity: 'critical',
      createdAt: new Date('2026-05-20T13:50:00+08:00'),
      audiences: [{ audience_type: 'region', region: 'Central' }],
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      title: 'All Responders - Standby',
      message:
        'Multiple incidents reported across CBD. All units on standby for immediate deployment.',
      severity: 'warning',
      createdAt: new Date('2026-05-20T13:50:00+08:00'),
      audiences: [
        { audience_type: 'organisation', organisation_id: spfOrganisationId },
        { audience_type: 'organisation', organisation_id: scdfOrganisationId },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      title: 'Public Safety Advisory',
      message:
        'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.',
      severity: 'advisory',
      createdAt: new Date('2026-05-20T13:50:00+08:00'),
      audiences: [{ audience_type: 'public' }],
    },
    {
      id: '40000000-0000-0000-0000-000000000004',
      title: 'MRT Disruption Notice',
      message:
        'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.',
      severity: 'info',
      createdAt: new Date('2026-05-20T13:50:00+08:00'),
      audiences: [{ audience_type: 'public' }],
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      title: 'Volunteer Call - Medical Support',
      message:
        'Multiple medical incidents requiring first aid support. Certified volunteers should report to nearest SCDF station.',
      severity: 'warning',
      createdAt: new Date('2026-05-20T13:50:00+08:00'),
      audiences: [
        { audience_type: 'organisation', organisation_id: scdfOrganisationId },
      ],
    },
  ];

  for (const broadcast of demoBroadcasts) {
    await prisma.broadcasts.upsert({
      where: { id: broadcast.id },
      update: {
        title: broadcast.title,
        message: broadcast.message,
        broadcast_type: 'emergency_advisory',
        severity: broadcast.severity,
        broadcast_status: 'published',
        created_by_user_id: govUserId,
        published_at: broadcast.createdAt,
        archived_at: null,
        created_at: broadcast.createdAt,
        updated_at: broadcast.createdAt,
      },
      create: {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        broadcast_type: 'emergency_advisory',
        severity: broadcast.severity,
        broadcast_status: 'published',
        created_by_user_id: govUserId,
        published_at: broadcast.createdAt,
        created_at: broadcast.createdAt,
        updated_at: broadcast.createdAt,
      },
    });

    await prisma.broadcast_audiences.deleteMany({
      where: { broadcast_id: broadcast.id },
    });

    await prisma.broadcast_audiences.createMany({
      data: broadcast.audiences.map((audience) =>
        toSeedBroadcastAudienceCreateManyInput(broadcast.id, audience),
      ),
    });
  }
}

function toSeedBroadcastAudienceCreateManyInput(
  broadcastId: string,
  audience: SeedBroadcastAudience,
): Prisma.broadcast_audiencesCreateManyInput {
  return {
    broadcast_id: broadcastId,
    audience_type: audience.audience_type,
    region: audience.audience_type === 'region' ? audience.region : undefined,
    organisation_id:
      audience.audience_type === 'organisation'
        ? audience.organisation_id
        : undefined,
  };
}

type SeedResource = {
  externalResourceId: string;
  name: string;
  category: string;
  total: number;
  available: number;
  deployed: number;
  reserved: number;
  maintenance: number;
};

type SeedOutlet = {
  agencyId: string;
  systemId: string;
  externalOutletId: string;
  name: string;
  type: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  resources: SeedResource[];
};

function res(
  externalResourceId: string,
  name: string,
  category: string,
  total: number,
  available: number,
  deployed: number,
  reserved: number,
  maintenance: number,
): SeedResource {
  return {
    externalResourceId,
    name,
    category,
    total,
    available,
    deployed,
    reserved,
    maintenance,
  };
}

const RESOURCE_OUTLETS: SeedOutlet[] = [
  // SCDF — fire stations
  {
    agencyId: 'SCDF',
    systemId: 'FIREWATCH',
    externalOutletId: 'SCDF-CENTRAL',
    name: 'Central Fire Station',
    type: 'fire_station',
    region: 'Central',
    address: '62 Hill Street',
    lat: 1.2926,
    lng: 103.8487,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 8, 5, 2, 0, 1),
      res('ambulance', 'Ambulances', 'vehicle', 12, 8, 3, 0, 1),
      res('rescue_team', 'Rescue Teams', 'crew', 10, 6, 3, 1, 0),
    ],
  },
  {
    agencyId: 'SCDF',
    systemId: 'FIREWATCH',
    externalOutletId: 'SCDF-JRG',
    name: 'Jurong Fire Station',
    type: 'fire_station',
    region: 'West',
    address: '22 Jurong West Street 26',
    lat: 1.3448,
    lng: 103.7076,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 7, 4, 2, 0, 1),
      res('ambulance', 'Ambulances', 'vehicle', 10, 7, 2, 0, 1),
      res('water_rescue_team', 'Water Rescue Teams', 'crew', 4, 3, 1, 0, 0),
    ],
  },
  {
    agencyId: 'SCDF',
    systemId: 'FIREWATCH',
    externalOutletId: 'SCDF-BDK',
    name: 'Bedok Fire Station',
    type: 'fire_station',
    region: 'East',
    address: '850 Bedok North Road',
    lat: 1.3315,
    lng: 103.9264,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 6, 5, 1, 0, 0),
      res('ambulance', 'Ambulances', 'vehicle', 11, 8, 2, 0, 1),
      res('hazmat_unit', 'Hazmat Units', 'specialist_unit', 3, 2, 1, 0, 0),
    ],
  },
  // SPF — police divisions
  {
    agencyId: 'SPF',
    systemId: 'POLNET',
    externalOutletId: 'SPF-CENTRAL-DIV',
    name: 'Central Police Division',
    type: 'police_station',
    region: 'Central',
    address: '391 New Bridge Road',
    lat: 1.2841,
    lng: 103.8404,
    resources: [
      res('patrol_car', 'Patrol Cars', 'vehicle', 32, 22, 8, 1, 1),
      res(
        'police_officer',
        'Police Officers',
        'personnel',
        220,
        156,
        48,
        10,
        6,
      ),
      res('traffic_unit', 'Traffic Units', 'specialist_unit', 12, 7, 4, 1, 0),
    ],
  },
  {
    agencyId: 'SPF',
    systemId: 'POLNET',
    externalOutletId: 'SPF-BEDOK-DIV',
    name: 'Bedok Police Division',
    type: 'police_station',
    region: 'East',
    address: '102 Bedok North Avenue 4',
    lat: 1.3296,
    lng: 103.9322,
    resources: [
      res('patrol_car', 'Patrol Cars', 'vehicle', 30, 21, 6, 2, 1),
      res('police_officer', 'Police Officers', 'personnel', 205, 149, 41, 9, 6),
      res('public_order_team', 'Public Order Teams', 'crew', 10, 6, 3, 1, 0),
    ],
  },
  // SingHealth — hospitals
  {
    agencyId: 'SINGHEALTH',
    systemId: 'SUNRISE',
    externalOutletId: 'SINGHEALTH-SGH',
    name: 'Singapore General Hospital',
    type: 'hospital',
    region: 'Central',
    address: 'Outram Road',
    lat: 1.2792,
    lng: 103.8351,
    resources: [
      res('ed_bed', 'Emergency Beds', 'bed', 60, 18, 38, 2, 2),
      res('icu_bed', 'ICU Beds', 'bed', 40, 9, 29, 1, 1),
      res('nurse_on_duty', 'Nurses On Duty', 'personnel', 320, 140, 170, 5, 5),
    ],
  },
  {
    agencyId: 'SINGHEALTH',
    systemId: 'SUNRISE',
    externalOutletId: 'SINGHEALTH-CGH',
    name: 'Changi General Hospital',
    type: 'hospital',
    region: 'East',
    address: '2 Simei Street 3',
    lat: 1.3402,
    lng: 103.9496,
    resources: [
      res('ed_bed', 'Emergency Beds', 'bed', 48, 16, 30, 1, 1),
      res('icu_bed', 'ICU Beds', 'bed', 28, 7, 20, 1, 0),
      res('nurse_on_duty', 'Nurses On Duty', 'personnel', 240, 108, 126, 3, 3),
    ],
  },
  // PUB — water operations depots
  {
    agencyId: 'PUB',
    systemId: 'WATERNET',
    externalOutletId: 'PUB-KALLANG-DEPOT',
    name: 'Kallang Water Operations Depot',
    type: 'water_operations_depot',
    region: 'Central',
    address: '40 Geylang Road',
    lat: 1.31,
    lng: 103.8714,
    resources: [
      res('portable_pump', 'Portable Pumps', 'equipment', 24, 16, 6, 1, 1),
      res('drainage_crew', 'Drainage Crews', 'crew', 12, 8, 3, 1, 0),
      res('flood_barrier', 'Flood Barriers', 'equipment', 420, 310, 80, 20, 10),
    ],
  },
];

async function seedResources() {
  const now = new Date();
  let outletCount = 0;
  let resourceCount = 0;

  for (const outlet of RESOURCE_OUTLETS) {
    const savedOutlet = await prisma.resource_outlets.upsert({
      where: {
        agency_id_external_outlet_id: {
          agency_id: outlet.agencyId,
          external_outlet_id: outlet.externalOutletId,
        },
      },
      update: {
        name: outlet.name,
        outlet_type: outlet.type,
        region: outlet.region,
        address: outlet.address,
        latitude: outlet.lat,
        longitude: outlet.lng,
        source_system_id: outlet.systemId,
        last_synced_at: now,
        updated_at: now,
      },
      create: {
        agency_id: outlet.agencyId,
        external_outlet_id: outlet.externalOutletId,
        name: outlet.name,
        outlet_type: outlet.type,
        region: outlet.region,
        address: outlet.address,
        latitude: outlet.lat,
        longitude: outlet.lng,
        source_system_id: outlet.systemId,
        last_synced_at: now,
      },
    });
    outletCount += 1;

    for (const resource of outlet.resources) {
      await prisma.resource_inventory.upsert({
        where: {
          outlet_id_external_resource_id: {
            outlet_id: savedOutlet.id,
            external_resource_id: resource.externalResourceId,
          },
        },
        update: {
          resource_name: resource.name,
          resource_category: resource.category,
          total: resource.total,
          available: resource.available,
          deployed: resource.deployed,
          reserved: resource.reserved,
          maintenance: resource.maintenance,
          last_synced_at: now,
          updated_at: now,
        },
        create: {
          outlet_id: savedOutlet.id,
          external_resource_id: resource.externalResourceId,
          resource_name: resource.name,
          resource_category: resource.category,
          unit: 'count',
          total: resource.total,
          available: resource.available,
          deployed: resource.deployed,
          reserved: resource.reserved,
          maintenance: resource.maintenance,
          last_synced_at: now,
        },
      });
      resourceCount += 1;
    }
  }

  console.log(
    `Resources:      ${outletCount} outlets, ${resourceCount} inventory rows`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
