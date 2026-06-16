import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Vercel serverless 环境下用单连接，不用 Pool
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  const databaseUrl = new URL(connectionString);
  const isLocalDatabase =
    databaseUrl.hostname === "localhost" || databaseUrl.hostname === "127.0.0.1";
  const hasSslMode = databaseUrl.searchParams.has("sslmode");

  const pool = new pg.Pool({
    connectionString,
    ssl: !isLocalDatabase && !hasSslMode ? { rejectUnauthorized: false } : undefined,
    max: 1, // serverless 环境限制连接数
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
