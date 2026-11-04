import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { createRequire } from 'module';
import path from 'path';

const PRISMA_SCHEMA_REV = '2026-11-04-v5';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaRev: string | undefined;
  pgPool: pg.Pool | undefined;
};

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file.'
    );
  }
  
  // Cache pg.Pool in globalThis to prevent connection leaks during hot reloads
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString,
      max: 20,                      // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Fail after 5 seconds if unable to connect
    });
  }
  const adapter = new PrismaPg(globalForPrisma.pgPool);

  let ClientClass: typeof PrismaClient = PrismaClient;
  try {
    const req = createRequire(path.join(process.cwd(), 'package.json'));
    if (req.cache) {
      for (const key of Object.keys(req.cache)) {
        if (key.includes('.prisma/client') || key.includes('@prisma/client')) {
          delete req.cache[key];
        }
      }
    }
    const freshMod = req('.prisma/client/index.js');
    if (freshMod?.PrismaClient) {
      ClientClass = freshMod.PrismaClient;
    }
  } catch (e) {
    console.warn('Fallback to static PrismaClient import:', e);
  }
  
  return new ClientClass({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

if (globalForPrisma.prismaSchemaRev !== PRISMA_SCHEMA_REV) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaSchemaRev = PRISMA_SCHEMA_REV;
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
