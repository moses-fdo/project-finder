import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const requests = await prisma.idVerificationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Get ID verification requests error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id, status, adminNote } = await req.json();

    if (!id || !status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json({ error: "Valid request ID and status (APPROVED or REJECTED) are required." }, { status: 400 });
    }

    const verificationReq = await prisma.idVerificationRequest.findUnique({
      where: { id: Number(id) },
    });

    if (!verificationReq) {
      return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
    }

    const updatedRequest = await prisma.idVerificationRequest.update({
      where: { id: Number(id) },
      data: {
        status,
        adminNote: adminNote ? adminNote.trim() : null,
      },
    });

    if (status === "APPROVED") {
      const cleanEmail = verificationReq.email.toLowerCase().trim();

      // 1. Add email to AllowedEmail list (whitelisted)
      await prisma.allowedEmail.upsert({
        where: { email: cleanEmail },
        update: { note: `Approved Student ID: ${verificationReq.collegeName}` },
        create: {
          email: cleanEmail,
          note: `Approved Student ID: ${verificationReq.collegeName}`,
          addedBy: currentUser.email || currentUser.name || "Admin",
        },
      });

      // 2. If user account exists, set verified = true
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser && !existingUser.verified) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { verified: true },
        });
      }
    }

    return NextResponse.json({
      message: `Verification request ${status.toLowerCase()} successfully!`,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error("Update ID verification request error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
