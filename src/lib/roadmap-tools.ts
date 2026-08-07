import { prisma, safeQuery } from "@/lib/prisma";

export async function getResourcesForCareer(career: string) {
  const roadmap = await safeQuery(
    () =>
      prisma.roadmap.findFirst({
        where: { career: { equals: career, mode: "insensitive" } },
        include: {
          steps: {
            orderBy: { order: "asc" },
            include: {
              resources: true,
            },
          },
        },
      }),
    null
  );

  if (!roadmap) {
    return { found: false, message: `No roadmap found for career: ${career}` };
  }

  return {
    found: true,
    career: roadmap.career,
    steps: roadmap.steps.map((step) => ({
      title: step.title,
      description: step.description,
      order: step.order,
      resources: step.resources.map((r) => ({
        title: r.title,
        type: r.type,
        url: r.url,
        difficulty: r.difficulty,
      })),
    })),
  };
}