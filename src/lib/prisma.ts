import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
