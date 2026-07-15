import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding database...");

  // Clean up existing data
  await prisma.bookmark.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});

  // 1. Create Skills
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
    "Arduino/IoT"
  ];

  const skills: any = {};
  for (const name of skillNames) {
    skills[name] = await prisma.skill.create({
      data: { name }
    });
  }
  console.log(`Created ${skillNames.length} skills.`);

  // 2. Hash Passwords
  const userPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("MosestheAdmin123", 10);

  // 3. Create Users
  const user1 = await prisma.user.create({
    data: {
      name: "Moses Fernando",
      email: "student@karunya.edu.in",
      password: userPasswordHash,
      department: "Computer Science",
      year: 3,
      role: "USER",
      verified: true,
      bio: "Full Stack Developer interested in building Web3 and IoT applications. Passionate about campus projects.",
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      skills: {
        connect: [
          { id: skills["React"].id },
          { id: skills["TypeScript"].id },
          { id: skills["Node.js"].id }
        ]
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "collaborator@karunya.edu.in",
      password: userPasswordHash,
      department: "Electronics & Communication",
      year: 2,
      role: "USER",
      verified: true,
      bio: "IoT enthusiast and electronics hobbyist. Loves working on hardware and embedded systems.",
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      skills: {
        connect: [
          { id: skills["Arduino/IoT"].id },
          { id: skills["Python"].id }
        ]
      }
    }
  });

  await prisma.user.create({
    data: {
      name: "Dr. Karunya Admin",
      email: "dmosesfernando@gmail.com",
      password: adminPasswordHash,
      department: "Information Technology",
      year: 4,
      role: "ADMIN",
      verified: true,
      bio: "System Administrator and Department supervisor for project collaborations."
    }
  });

  console.log("Created users.");

  // 4. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: "Smart Campus IoT Dashboard",
      description: "Developing an IoT dashboard to monitor campus energy consumption, library seating, and classroom occupancy in real-time. We are planning to deploy sensors across the department block and feed data into a Next.js frontend via WebSockets.",
      status: "OPEN",
      ownerId: user1.id,
      skills: {
        connect: [
          { id: skills["Next.js"].id },
          { id: skills["Node.js"].id },
          { id: skills["Arduino/IoT"].id }
        ]
      }
    }
  });

  await prisma.project.create({
    data: {
      title: "AgriTech Crop Yield Predictor",
      description: "A Machine Learning model that predicts soil moisture and recommends ideal crops based on regional weather history and satellite imagery. We need a frontend designer to build the dashboard and someone to optimize the ML pipeline.",
      status: "OPEN",
      ownerId: user2.id,
      skills: {
        connect: [
          { id: skills["Python"].id },
          { id: skills["Machine Learning"].id },
          { id: skills["UI/UX Design"].id }
        ]
      }
    }
  });

  console.log("Created projects.");

  // 5. Create a Mock Application
  await prisma.application.create({
    data: {
      projectId: project1.id,
      userId: user2.id,
      message: "Hey Moses! I have experience with Arduino sensors and can help hook up the hardware sensors and feed data via REST APIs.",
      status: "PENDING"
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
