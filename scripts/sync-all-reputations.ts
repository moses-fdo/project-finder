import { prisma } from "../src/lib/prisma";
import { calculateUserReputation } from "../src/lib/reputation/calculator";

async function syncAll() {
  console.log("Syncing Developer Reputation for all users...");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      githubUrl: true,
      linkedinUrl: true,
      bio: true,
      year: true,
      skills: { select: { id: true, name: true } },
      projects: { select: { id: true } },
      applications: { select: { id: true } },
    },
  });

  console.log(`Found ${users.length} users. Calculating and persisting reputation...`);

  for (const user of users) {
    try {
      const rep = await calculateUserReputation({
        userId: user.id,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        bio: user.bio,
        year: user.year,
        skills: user.skills,
        userProjectsCount: user.projects.length,
        userApplicationsCount: user.applications.length,
      });
      console.log(`Synced User #${user.id}: Score ${rep.score}, Stars ${rep.stars}, Tier ${rep.tier}`);
    } catch (err) {
      console.error(`Failed to sync User #${user.id}:`, err);
    }
  }

  console.log("Developer Reputation sync completed for all users!");
}

syncAll().catch(console.error).finally(() => prisma.$disconnect());
