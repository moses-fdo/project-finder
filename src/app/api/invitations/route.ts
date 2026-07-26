import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const currentUserId = Number((currentUser as any).id);

    const [receivedInvitations, sentInvitations] = await Promise.all([
      prisma.invitation.findMany({
        where: { receiverId: currentUserId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              owner: { select: { id: true, name: true, department: true } },
              skills: { select: { id: true, name: true } },
            },
          },
          sender: {
            select: { id: true, name: true, department: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { senderId: currentUserId },
        include: {
          project: { select: { id: true, title: true } },
          receiver: { select: { id: true, name: true, department: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ receivedInvitations, sentInvitations });
  } catch (error: any) {
    console.error("Fetch invitations error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const senderId = Number((currentUser as any).id);
    const body = await req.json();
    const { projectId, receiverId, message, role } = body;

    const pId = Number(projectId);
    const rId = Number(receiverId);

    if (!pId || !rId) {
      return NextResponse.json({ error: "Project ID and Recipient ID are required." }, { status: 400 });
    }

    if (senderId === rId) {
      return NextResponse.json({ error: "You cannot invite yourself." }, { status: 400 });
    }

    // Verify caller owns the project
    const project = await prisma.project.findUnique({
      where: { id: pId },
      select: { id: true, title: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.ownerId !== senderId && (currentUser as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Only the project owner can send invitations." }, { status: 403 });
    }

    // Check if recipient exists
    const receiver = await prisma.user.findUnique({
      where: { id: rId },
      select: { id: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Recipient user not found." }, { status: 404 });
    }

    // Check if an invitation already exists
    const existing = await prisma.invitation.findUnique({
      where: {
        projectId_receiverId: {
          projectId: pId,
          receiverId: rId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `An invitation for this project has already been sent to ${receiver.name}.` },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.create({
      data: {
        projectId: pId,
        senderId,
        receiverId: rId,
        message: message || null,
        role: role || null,
        status: "PENDING",
      },
      include: {
        project: { select: { id: true, title: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    // Notify the recipient
    const senderName = (currentUser as any).name || "A project owner";
    await prisma.notification.create({
      data: {
        userId: rId,
        type: "INVITATION_RECEIVED",
        message: `${senderName} invited you to collaborate on project "${project.title}".`,
        link: "/dashboard?tab=invitations",
      },
    });

    return NextResponse.json({
      message: `Invitation successfully sent to ${receiver.name}!`,
      invitation,
    });
  } catch (error: any) {
    console.error("Create invitation error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
