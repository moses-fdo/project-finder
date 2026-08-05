import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { syncProjectCapacity } from "@/lib/projects/capacity";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const invitationId = Number(id);
    const { status } = await req.json();

    if (!status || (status !== "ACCEPTED" && status !== "DECLINED")) {
      return NextResponse.json({ error: "Invalid status. Must be ACCEPTED or DECLINED." }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        project: { select: { id: true, title: true, status: true, teamSize: true, slotsFilled: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);
    const isAdmin = (currentUser as any).role === "ADMIN";

    if (invitation.receiverId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to respond to this invitation." }, { status: 403 });
    }

    let updatedInvitation;
    try {
      updatedInvitation = await prisma.$transaction(
        async (tx) => {
          const updated = await tx.invitation.update({
            where: { id: invitationId },
            data: { status },
          });

          // Update project capacity (checking for prior accepted applications/invitations for this user)
          if (invitation.status !== "ACCEPTED" && status === "ACCEPTED") {
            const existingApplication = await tx.application.findFirst({
              where: {
                projectId: invitation.projectId,
                userId: invitation.receiverId,
                status: "ACCEPTED",
              },
            });
            const existingInvitation = await tx.invitation.findFirst({
              where: {
                projectId: invitation.projectId,
                receiverId: invitation.receiverId,
                status: "ACCEPTED",
                id: { not: invitationId },
              },
            });
            const alreadyAccepted = Boolean(existingApplication || existingInvitation);
            if (!alreadyAccepted) {
              await syncProjectCapacity(tx, invitation.projectId, 1);
            }
          } else if (invitation.status === "ACCEPTED" && status !== "ACCEPTED") {
            const remainingApplication = await tx.application.findFirst({
              where: {
                projectId: invitation.projectId,
                userId: invitation.receiverId,
                status: "ACCEPTED",
              },
            });
            const remainingInvitation = await tx.invitation.findFirst({
              where: {
                projectId: invitation.projectId,
                receiverId: invitation.receiverId,
                status: "ACCEPTED",
                id: { not: invitationId },
              },
            });
            const stillAccepted = Boolean(remainingApplication || remainingInvitation);
            if (!stillAccepted) {
              await syncProjectCapacity(tx, invitation.projectId, -1);
            }
          }

          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err: any) {
      if (err?.message === "Project is already at full capacity.") {
        return NextResponse.json({ error: "Project is already at full capacity." }, { status: 400 });
      }
      throw err;
    }

    // Notify the invitation sender
    const actionWord = status === "ACCEPTED" ? "accepted" : "declined";
    await prisma.notification.create({
      data: {
        userId: invitation.senderId,
        type: `INVITATION_${status}`,
        message: `${invitation.receiver.name} ${actionWord} your invitation to join "${invitation.project.title}".`,
        link: "/dashboard?tab=invitations",
      },
    });

    return NextResponse.json({
      message: `Invitation ${actionWord} successfully.`,
      invitation: updatedInvitation,
    });
  } catch (error: any) {
    console.error("Update invitation error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const invitationId = Number(id);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);
    const isAdmin = (currentUser as any).role === "ADMIN";

    if (invitation.senderId !== currentUserId && invitation.receiverId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to delete this invitation." }, { status: 403 });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ message: "Invitation removed successfully." });
  } catch (error: any) {
    console.error("Delete invitation error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
