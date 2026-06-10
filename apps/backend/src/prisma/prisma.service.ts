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

    const adapter = new PrismaPg({
      connectionString,
      ...(PrismaService.shouldUseSsl(connectionString)
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });

    super({ adapter });
  }

  private static shouldUseSsl(connectionString: string): boolean {
    const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

    try {
      const url = new URL(connectionString);
      const sslmode = url.searchParams.get('sslmode');

      if (sslmode) {
        return !['disable', 'allow', 'prefer'].includes(sslmode);
      }

      return !localHosts.has(url.hostname);
    } catch {
      return true;
    }
  }
}
