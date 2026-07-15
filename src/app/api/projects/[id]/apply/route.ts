import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in to apply." }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);
    const { message } = await req.json();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.status !== "OPEN") {
      return NextResponse.json({ error: "This project is closed for applications." }, { status: 400 });
    }

    const currentUserId = Number((currentUser as any).id);

    if (project.ownerId === currentUserId) {
      return NextResponse.json({ error: "You cannot apply to your own project." }, { status: 400 });
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied to this project." }, { status: 400 });
    }

    const application = await prisma.application.create({
      data: {
        projectId,
        userId: currentUserId,
        message,
        status: "PENDING",
      },
    });

    // Notify project owner
    await prisma.notification.create({
      data: {
        userId: project.ownerId,
        type: "APPLICATION_RECEIVED",
        message: `${currentUser.name} applied to collaborate on "${project.title}".`,
      },
    });

    return NextResponse.json({ message: "Applied successfully.", application });
  } catch (error: any) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
