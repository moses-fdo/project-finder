import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding skills...");

  // Only seed the skills lookup table — no fake users or projects
  const skillNames = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Tailwind CSS",
    "Python",
    "PostgreSQL",
    "Machine Learning",
    "UI/UX Design",
    "Arduino/IoT",
  ];

  for (const name of skillNames) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${skillNames.length} skills.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
