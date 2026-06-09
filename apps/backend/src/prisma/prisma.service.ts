import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    // RDS enforces TLS (rds.force_ssl). Force an encrypted connection even when
    // DATABASE_URL omits an sslmode param. rejectUnauthorized is false because the
    // Amazon RDS CA isn't in Node's default trust store; sslmode=require alone fails.
    const adapter = new PrismaPg({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    super({ adapter });
  }
}
