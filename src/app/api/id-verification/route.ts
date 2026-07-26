import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, collegeName, department, idCardImage } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid Email address is required." }, { status: 400 });
    }

    if (!collegeName || typeof collegeName !== "string" || !collegeName.trim()) {
      return NextResponse.json({ error: "College/University Name is required." }, { status: 400 });
    }

    if (!idCardImage || typeof idCardImage !== "string" || !idCardImage.trim()) {
      return NextResponse.json({ error: "Student ID Card image is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user is already verified or whitelisted
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser?.verified) {
      return NextResponse.json(
        { error: "Your account is already verified! You can log in directly." },
        { status: 400 }
      );
    }

    const isAllowed = await prisma.allowedEmail.findUnique({
      where: { email: cleanEmail },
    });

    if (isAllowed) {
      return NextResponse.json(
        { error: "Your email is already whitelisted! You can sign up or log in directly." },
        { status: 400 }
      );
    }

    // Check existing request
    const existingRequest = await prisma.idVerificationRequest.findUnique({
      where: { email: cleanEmail },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "You already have a pending verification request. Our admins are reviewing it." },
          { status: 400 }
        );
      }

      // Update existing rejected request with new image & details
      const updatedRequest = await prisma.idVerificationRequest.update({
        where: { email: cleanEmail },
        data: {
          name: name.trim(),
          collegeName: collegeName.trim(),
          department: department ? department.trim() : null,
          idCardImage,
          status: "PENDING",
          adminNote: null,
        },
      });

      return NextResponse.json({
        message: "Your Student ID verification request has been updated and resubmitted for admin review!",
        request: updatedRequest,
      });
    }

    const newRequest = await prisma.idVerificationRequest.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        collegeName: collegeName.trim(),
        department: department ? department.trim() : null,
        idCardImage,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Student ID verification request submitted successfully! Our admins will review your request within 24 hours.",
      request: newRequest,
    });
  } catch (error: any) {
    console.error("ID verification submission error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
