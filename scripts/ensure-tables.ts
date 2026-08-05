import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Creating UserReputation table if not exists via Neon serverless adapter...");

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserReputation" (
          "id" SERIAL NOT NULL,
          "userId" INTEGER NOT NULL,
          "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "stars" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "tier" TEXT NOT NULL DEFAULT 'Beginner',
          "githubConnected" BOOLEAN NOT NULL DEFAULT false,
          "githubVerified" BOOLEAN NOT NULL DEFAULT false,
          "linkedinVerified" BOOLEAN NOT NULL DEFAULT false,
          "githubScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "experienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "certificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "breakdownJson" JSONB,
          "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "UserReputation_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UserReputation_userId_key" ON "UserReputation"("userId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserReputation_score_idx" ON "UserReputation"("score");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'UserReputation_userId_fkey'
          ) THEN
              ALTER TABLE "UserReputation"
              ADD CONSTRAINT "UserReputation_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
      END $$;
    `);

    console.log("Successfully created UserReputation table and indexes on Neon DB!");
  } catch (err) {
    console.error("Error creating UserReputation table:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
