import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding skills...");

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

  console.log("Seeding roadmaps...");

  const roadmaps = [
    {
      career: "Frontend Developer",
      title: "Frontend Developer Roadmap",
      description: "A path to becoming a skilled frontend web developer.",
      steps: [
        {
          title: "Master JavaScript & TypeScript",
          description: "Build a strong foundation in modern JS and type safety.",
          order: 1,
          resources: [
            {
              title: "TypeScript Handbook",
              type: "docs",
              url: "https://www.typescriptlang.org/docs/handbook/intro.html",
              difficulty: "Beginner",
            },
          ],
        },
        {
          title: "Learn React",
          description: "Understand components, state, and hooks.",
          order: 2,
          resources: [
            {
              title: "React Official Docs",
              type: "docs",
              url: "https://react.dev/learn",
              difficulty: "Beginner",
            },
          ],
        },
        {
          title: "Learn Next.js",
          description: "Server-side rendering, routing, and full-stack React.",
          order: 3,
          resources: [
            {
              title: "Next.js Documentation",
              type: "docs",
              url: "https://nextjs.org/docs",
              difficulty: "Intermediate",
            },
          ],
        },
      ],
    },
    {
      career: "AI Engineer",
      title: "AI Engineer Roadmap",
      description: "A path to building and deploying AI-powered applications.",
      steps: [
        {
          title: "Python Fundamentals",
          description: "Core Python skills needed for AI development.",
          order: 1,
          resources: [
            {
              title: "Python Official Tutorial",
              type: "docs",
              url: "https://docs.python.org/3/tutorial/",
              difficulty: "Beginner",
            },
          ],
        },
        {
          title: "Learn Deep Learning Frameworks",
          description: "Get hands-on with PyTorch or TensorFlow.",
          order: 2,
          resources: [
            {
              title: "PyTorch Official Tutorials",
              type: "course",
              url: "https://pytorch.org/tutorials/",
              difficulty: "Intermediate",
            },
          ],
        },
        {
          title: "LLM Orchestration",
          description: "Learn frameworks like LangChain for building LLM apps.",
          order: 3,
          resources: [
            {
              title: "LangChain Documentation",
              type: "docs",
              url: "https://python.langchain.com/docs/introduction/",
              difficulty: "Intermediate",
            },
          ],
        },
      ],
    },
  ];

  for (const roadmap of roadmaps) {
    const existing = await prisma.roadmap.findFirst({
      where: { career: roadmap.career },
    });

    if (existing) {
      console.log(`Roadmap for "${roadmap.career}" already exists, skipping.`);
      continue;
    }

    await prisma.roadmap.create({
      data: {
        career: roadmap.career,
        title: roadmap.title,
        description: roadmap.description,
        steps: {
          create: roadmap.steps.map((step) => ({
            title: step.title,
            description: step.description,
            order: step.order,
            resources: {
              create: step.resources,
            },
          })),
        },
      },
    });

    console.log(`Seeded roadmap: ${roadmap.career}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });