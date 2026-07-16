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

    const currentUserId = Number((currentUser as any).id);
    if (!currentUserId || isNaN(currentUserId)) {
      return NextResponse.json({ error: "Invalid session. Please sign in again." }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
    }

    // Parse body safely
    let message: string | undefined;
    try {
      const body = await req.json();
      message = typeof body?.message === "string" ? body.message.trim() : undefined;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!message || message.length === 0) {
      return NextResponse.json({ error: "Please write a message explaining how you can contribute." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, status: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.status !== "OPEN") {
      return NextResponse.json({ error: "This project is closed for applications." }, { status: 400 });
    }

    if (project.ownerId === currentUserId) {
      return NextResponse.json({ error: "You cannot apply to your own project." }, { status: 400 });
    }

    const existingApplication = await prisma.application.findUnique({
      where: { projectId_userId: { projectId, userId: currentUserId } },
    });

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied to this project." }, { status: 400 });
    }

    // Create application and notification in a transaction so both succeed or both fail
    const [application] = await prisma.$transaction([
      prisma.application.create({
        data: {
          projectId,
          userId: currentUserId,
          message,
        },
      }),
      prisma.notification.create({
        data: {
          userId: project.ownerId,
          type: "APPLICATION_RECEIVED",
          message: `${currentUser.name ?? "Someone"} applied to collaborate on "${project.title}".`,
        },
      }),
    ]);

    return NextResponse.json({ message: "Applied successfully.", application });
  } catch (error: any) {
    console.error("[apply] Error:", error?.message ?? error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
