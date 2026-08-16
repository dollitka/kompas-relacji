import { PrismaClient } from "@prisma/client";

// Standardowy pattern singletona dla Prisma w Next.js (unika wyczerpania
// puli połączeń przy hot-reload w trybie dev).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
