import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/sd-hub'
  try {
    const adapter = new PrismaPg({ connectionString })
    return new PrismaClient({ adapter })
  } catch {
    // Fallback if adapter fails (e.g., during build)
    return new PrismaClient()
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
