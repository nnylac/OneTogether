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

  console.log('\nSeed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
