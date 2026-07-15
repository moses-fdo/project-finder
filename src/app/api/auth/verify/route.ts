import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json({ message: "User is already verified." });
    }

    if (!user.otpCode || !user.otpExpires) {
      return NextResponse.json({ error: "No active verification code found." }, { status: 400 });
    }

    const now = new Date();
    if (now > user.otpExpires) {
      return NextResponse.json({ error: "Verification code has expired. Please sign up again to generate a new one." }, { status: 400 });
    }

    if (user.otpCode !== code.trim()) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    // Mark as verified and clear OTP fields
    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
        otpCode: null,
        otpExpires: null
      }
    });

    return NextResponse.json({ message: "Email verified successfully. You can now log in." });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
