import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL env var is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

  await prisma.organisations.upsert({
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

  console.log('Organisations: SCDF, SPF, SGH, MOH, IMDA');

  // --- Citizen (role: user) ---
  const citizenUser = await prisma.users.upsert({
    where: { username: 'citizen' },
    update: {},
    create: {
      username: 'citizen',
      email: 'citizen@demo.sg',
      first_name: 'Demo',
      last_name: 'Citizen',
      role: 'user',
      is_verified: true,
    },
  });

  await prisma.accounts.upsert({
    where: { user_id: citizenUser.id },
    update: {},
    create: {
      user_id: citizenUser.id,
      password_hash: hashPassword('citizen'),
    },
  });

  console.log('User created:   citizen  / citizen  → /citizen');

  // --- Responder (role: responder, org: SCDF) ---
  const responderUser = await prisma.users.upsert({
    where: { username: 'responder' },
    update: {},
    create: {
      username: 'responder',
      email: 'responder@demo.sg',
      first_name: 'Demo',
      last_name: 'Responder',
      role: 'responder',
      is_verified: true,
      user_organisation_id: scdf.id,
    },
  });

  await prisma.accounts.upsert({
    where: { user_id: responderUser.id },
    update: {},
    create: {
      user_id: responderUser.id,
      password_hash: hashPassword('responder'),
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

  console.log('User created:   responder / responder → /responder');

  // --- Responder 2 (SPF) ---
  const spfResponder = await prisma.users.upsert({
    where: { username: 'spf.responder' },
    update: {},
    create: {
      username: 'spf.responder',
      email: 'spf.responder@demo.sg',
      first_name: 'SPF',
      last_name: 'Officer',
      role: 'responder',
      is_verified: true,
      user_organisation_id: spf.id,
    },
  });

  await prisma.accounts.upsert({
    where: { user_id: spfResponder.id },
    update: {},
    create: {
      user_id: spfResponder.id,
      password_hash: hashPassword('responder'),
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

  console.log('User created:   spf.responder / responder → /responder');

  // --- Government (role: admin) ---
  const govUser = await prisma.users.upsert({
    where: { username: 'gov' },
    update: {},
    create: {
      username: 'gov',
      email: 'gov@demo.sg',
      first_name: 'Demo',
      last_name: 'Government',
      role: 'admin',
      is_verified: true,
    },
  });

  await prisma.accounts.upsert({
    where: { user_id: govUser.id },
    update: {},
    create: {
      user_id: govUser.id,
      password_hash: hashPassword('gov'),
    },
  });

  console.log('User created:   gov      / gov      → /government');

  // --- Resource inventory ---
  // Mirrors the shape the agency simulators emit (apps/external/agencies/*/main.py)
  // so the responder Resources view has data without the Python sims running.
  // In production the sims are not deployed and the poller can't reach
  // localhost:810x, so these seeded rows are what the page renders.
  await seedResources();

  console.log('\nSeed complete.');
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
  return { externalResourceId, name, category, total, available, deployed, reserved, maintenance };
}

const RESOURCE_OUTLETS: SeedOutlet[] = [
  // SCDF — fire stations
  {
    agencyId: 'SCDF', systemId: 'FIREWATCH', externalOutletId: 'SCDF-CENTRAL',
    name: 'Central Fire Station', type: 'fire_station', region: 'Central',
    address: '62 Hill Street', lat: 1.2926, lng: 103.8487,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 8, 5, 2, 0, 1),
      res('ambulance', 'Ambulances', 'vehicle', 12, 8, 3, 0, 1),
      res('rescue_team', 'Rescue Teams', 'crew', 10, 6, 3, 1, 0),
    ],
  },
  {
    agencyId: 'SCDF', systemId: 'FIREWATCH', externalOutletId: 'SCDF-JRG',
    name: 'Jurong Fire Station', type: 'fire_station', region: 'West',
    address: '22 Jurong West Street 26', lat: 1.3448, lng: 103.7076,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 7, 4, 2, 0, 1),
      res('ambulance', 'Ambulances', 'vehicle', 10, 7, 2, 0, 1),
      res('water_rescue_team', 'Water Rescue Teams', 'crew', 4, 3, 1, 0, 0),
    ],
  },
  {
    agencyId: 'SCDF', systemId: 'FIREWATCH', externalOutletId: 'SCDF-BDK',
    name: 'Bedok Fire Station', type: 'fire_station', region: 'East',
    address: '850 Bedok North Road', lat: 1.3315, lng: 103.9264,
    resources: [
      res('fire_engine', 'Fire Engines', 'vehicle', 6, 5, 1, 0, 0),
      res('ambulance', 'Ambulances', 'vehicle', 11, 8, 2, 0, 1),
      res('hazmat_unit', 'Hazmat Units', 'specialist_unit', 3, 2, 1, 0, 0),
    ],
  },
  // SPF — police divisions
  {
    agencyId: 'SPF', systemId: 'POLNET', externalOutletId: 'SPF-CENTRAL-DIV',
    name: 'Central Police Division', type: 'police_station', region: 'Central',
    address: '391 New Bridge Road', lat: 1.2841, lng: 103.8404,
    resources: [
      res('patrol_car', 'Patrol Cars', 'vehicle', 32, 22, 8, 1, 1),
      res('police_officer', 'Police Officers', 'personnel', 220, 156, 48, 10, 6),
      res('traffic_unit', 'Traffic Units', 'specialist_unit', 12, 7, 4, 1, 0),
    ],
  },
  {
    agencyId: 'SPF', systemId: 'POLNET', externalOutletId: 'SPF-BEDOK-DIV',
    name: 'Bedok Police Division', type: 'police_station', region: 'East',
    address: '102 Bedok North Avenue 4', lat: 1.3296, lng: 103.9322,
    resources: [
      res('patrol_car', 'Patrol Cars', 'vehicle', 30, 21, 6, 2, 1),
      res('police_officer', 'Police Officers', 'personnel', 205, 149, 41, 9, 6),
      res('public_order_team', 'Public Order Teams', 'crew', 10, 6, 3, 1, 0),
    ],
  },
  // SingHealth — hospitals
  {
    agencyId: 'SINGHEALTH', systemId: 'SUNRISE', externalOutletId: 'SINGHEALTH-SGH',
    name: 'Singapore General Hospital', type: 'hospital', region: 'Central',
    address: 'Outram Road', lat: 1.2792, lng: 103.8351,
    resources: [
      res('ed_bed', 'Emergency Beds', 'bed', 60, 18, 38, 2, 2),
      res('icu_bed', 'ICU Beds', 'bed', 40, 9, 29, 1, 1),
      res('nurse_on_duty', 'Nurses On Duty', 'personnel', 320, 140, 170, 5, 5),
    ],
  },
  {
    agencyId: 'SINGHEALTH', systemId: 'SUNRISE', externalOutletId: 'SINGHEALTH-CGH',
    name: 'Changi General Hospital', type: 'hospital', region: 'East',
    address: '2 Simei Street 3', lat: 1.3402, lng: 103.9496,
    resources: [
      res('ed_bed', 'Emergency Beds', 'bed', 48, 16, 30, 1, 1),
      res('icu_bed', 'ICU Beds', 'bed', 28, 7, 20, 1, 0),
      res('nurse_on_duty', 'Nurses On Duty', 'personnel', 240, 108, 126, 3, 3),
    ],
  },
  // PUB — water operations depots
  {
    agencyId: 'PUB', systemId: 'WATERNET', externalOutletId: 'PUB-KALLANG-DEPOT',
    name: 'Kallang Water Operations Depot', type: 'water_operations_depot', region: 'Central',
    address: '40 Geylang Road', lat: 1.3100, lng: 103.8714,
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

  console.log(`Resources:      ${outletCount} outlets, ${resourceCount} inventory rows`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
