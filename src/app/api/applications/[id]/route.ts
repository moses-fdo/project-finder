import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendApplicationStatusEmail } from "@/lib/email";
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
    const applicationId = Number(id);
    const { status } = await req.json();

    if (!status || (status !== "ACCEPTED" && status !== "REJECTED")) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);
    const isAdmin = (currentUser as any).role === "ADMIN";

    if (application.project.ownerId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to update this application." }, { status: 403 });
    }

    let updatedApplication;
    try {
      updatedApplication = await prisma.$transaction(
        async (tx) => {
          const updated = await tx.application.update({
            where: { id: applicationId },
            data: { status },
          });

          if (application.status !== "ACCEPTED" && status === "ACCEPTED") {
            await syncProjectCapacity(tx, application.projectId, 1);
          } else if (application.status === "ACCEPTED" && status !== "ACCEPTED") {
            await syncProjectCapacity(tx, application.projectId, -1);
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

    // Notify the applicant via in-app notification
    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: `APPLICATION_${status}`,
        message: `Your application to collaborate on "${application.project.title}" has been ${status.toLowerCase()}.`,
        link: "/dashboard?tab=applications",
      },
    });

    // Send transactional email to applicant
    if (application.user?.email) {
      await sendApplicationStatusEmail({
        email: application.user.email,
        name: application.user.name || "Student",
        projectTitle: application.project.title,
        status,
      });
    }

    return NextResponse.json({
      message: `Application ${status.toLowerCase()} successfully.`,
      application: updatedApplication,
    });
  } catch (error: any) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
