import { PrismaClient, Prisma } from "@prisma/client";

export async function syncProjectCapacity(
  tx: Prisma.TransactionClient | PrismaClient,
  projectId: number,
  delta: number
) {
  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { id: true, slotsFilled: true, teamSize: true, status: true },
  });

  if (!project) return;

  if (delta > 0 && project.teamSize !== null && project.teamSize > 0 && project.slotsFilled >= project.teamSize) {
    throw new Error("Project is already at full capacity.");
  }

  let newSlotsFilled = project.slotsFilled + delta;
  if (delta < 0) {
    newSlotsFilled = Math.max(0, newSlotsFilled);
  } else if (delta > 0 && project.teamSize !== null && project.teamSize > 0) {
    newSlotsFilled = Math.min(newSlotsFilled, project.teamSize);
  }

  let newStatus = project.status;

  if (delta > 0) {
    if (project.teamSize !== null && project.teamSize > 0 && newSlotsFilled >= project.teamSize) {
      newStatus = "FULL";
    }
  } else if (delta < 0) {
    if (project.status === "FULL" && (project.teamSize === null || newSlotsFilled < project.teamSize)) {
      newStatus = "OPEN";
    }
  }

  await tx.project.update({
    where: { id: projectId },
    data: {
      slotsFilled: newSlotsFilled,
      status: newStatus,
    },
  });
}
