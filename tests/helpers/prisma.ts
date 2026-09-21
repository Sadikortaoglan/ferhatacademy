import { PrismaClient } from "@prisma/client";

// Isolated Prisma client for integration tests — always reads TEST_DATABASE_URL
// set by the globalSetup container bootstrap.
export const testPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
  log: [],
});
