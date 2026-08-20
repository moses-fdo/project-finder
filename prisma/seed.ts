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
        {
          career: "Backend Developer",
          title: "Backend Developer Roadmap",
          description: "A path to building robust, scalable server-side systems.",
          steps: [
            {
              title: "Learn a Backend Language",
              description: "Get comfortable with Node.js or Python for server-side logic.",
              order: 1,
              resources: [
                {
                  title: "Node.js Official Docs",
                  type: "docs",
                  url: "https://nodejs.org/en/docs",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Databases & ORMs",
              description: "Understand SQL, Postgres, and ORMs like Prisma.",
              order: 2,
              resources: [
                {
                  title: "Prisma Documentation",
                  type: "docs",
                  url: "https://www.prisma.io/docs",
                  difficulty: "Intermediate",
                },
              ],
            },
            {
              title: "APIs & Authentication",
              description: "Build REST APIs and implement secure authentication.",
              order: 3,
              resources: [
                {
                  title: "JWT.io Introduction",
                  type: "docs",
                  url: "https://jwt.io/introduction",
                  difficulty: "Intermediate",
                },
              ],
            },
          ],
        },
        {
          career: "Data Scientist",
          title: "Data Scientist Roadmap",
          description: "A path to analyzing data and building predictive models.",
          steps: [
            {
              title: "Python for Data Analysis",
              description: "Master Pandas, NumPy, and data manipulation.",
              order: 1,
              resources: [
                {
                  title: "Pandas Documentation",
                  type: "docs",
                  url: "https://pandas.pydata.org/docs/",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Statistics & Visualization",
              description: "Learn statistical analysis and tools like Matplotlib.",
              order: 2,
              resources: [
                {
                  title: "Matplotlib Tutorials",
                  type: "docs",
                  url: "https://matplotlib.org/stable/tutorials/index.html",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Machine Learning Basics",
              description: "Get started with scikit-learn and core ML concepts.",
              order: 3,
              resources: [
                {
                  title: "Scikit-learn Getting Started",
                  type: "docs",
                  url: "https://scikit-learn.org/stable/getting_started.html",
                  difficulty: "Intermediate",
                },
              ],
            },
          ],
        },
        {
          career: "Mobile Developer",
          title: "Mobile Developer Roadmap",
          description: "A path to building cross-platform mobile applications.",
          steps: [
            {
              title: "Learn React Native or Flutter",
              description: "Pick a cross-platform framework and build your first app.",
              order: 1,
              resources: [
                {
                  title: "React Native Documentation",
                  type: "docs",
                  url: "https://reactnative.dev/docs/getting-started",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Mobile UI Patterns",
              description: "Understand navigation, gestures, and platform conventions.",
              order: 2,
              resources: [
                {
                  title: "Material Design Guidelines",
                  type: "docs",
                  url: "https://m3.material.io/",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Publishing & Native Features",
              description: "Learn app store deployment and native device APIs.",
              order: 3,
              resources: [
                {
                  title: "Expo Documentation",
                  type: "docs",
                  url: "https://docs.expo.dev/",
                  difficulty: "Intermediate",
                },
              ],
            },
          ],
        },
        {
          career: "UI/UX Designer",
          title: "UI/UX Designer Roadmap",
          description: "A path to designing intuitive, user-centered digital products.",
          steps: [
            {
              title: "Design Fundamentals",
              description: "Learn color theory, typography, and layout principles.",
              order: 1,
              resources: [
                {
                  title: "Laws of UX",
                  type: "docs",
                  url: "https://lawsofux.com/",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "Design Tools",
              description: "Get hands-on with Figma for prototyping and design systems.",
              order: 2,
              resources: [
                {
                  title: "Figma Learn Hub",
                  type: "course",
                  url: "https://www.figma.com/resource-library/",
                  difficulty: "Beginner",
                },
              ],
            },
            {
              title: "User Research & Testing",
              description: "Learn to validate designs through user feedback.",
              order: 3,
              resources: [
                {
                  title: "Nielsen Norman Group Articles",
                  type: "docs",
                  url: "https://www.nngroup.com/articles/",
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