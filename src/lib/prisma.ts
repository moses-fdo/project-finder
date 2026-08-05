import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes("neon.tech")) {
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T = null as unknown as T): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // If the table does not exist yet (Prisma error P2021), return fallback immediately without retrying
    if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
      return fallback;
    }
    try {
      await new Promise((r) => setTimeout(r, 600));
      return await fn();
    } catch (retryErr: any) {
      if (retryErr?.code !== "P2021" && !retryErr?.message?.includes("does not exist")) {
        console.warn("[prisma] Database query failed after retry:", retryErr);
      }
      return fallback;
    }
  }
}
