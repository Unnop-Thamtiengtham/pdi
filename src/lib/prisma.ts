import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

const prismaClientSingleton = () => {
  // Safe fallback to prevent pool instantiation errors during compilation when DATABASE_URL is empty
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/pdi_db?schema=public';
  
  // Cache pg.Pool in globalThis to prevent connection leaks during hot reloads
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({ connectionString });
  }
  const adapter = new PrismaPg(globalForPrisma.pgPool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

