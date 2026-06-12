import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client instance.
 * In development, store on globalThis to avoid exhausting connections during
 * hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
