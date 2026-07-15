import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";

async function sendOtpEmail(email: string, name: string, code: string) {
  if (resend) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

      await resend.emails.send({
        from: `Karunya Collab <${fromEmail}>`,
        to: email,
        subject: "Verify your Karunya Collab Account",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #ffffff; color: #09090b;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 6px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 24px;">Karunya Collab</h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Project Collaboration Hub</p>
            </div>
            <div style="padding: 20px;">
              <h3 style="margin-top: 0; color: #09090b;">Welcome, ${name}!</h3>
              <p style="font-size: 14px; color: #71717a; line-height: 1.5;">
                Thank you for creating an account on Karunya Collab. Please use the following 6-digit verification code to complete your signup process. This code is active for 15 minutes.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; color: #6366f1;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5; margin-bottom: 0;">
                If you did not request this email, you can safely ignore it.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`OTP email sent successfully to ${email} via Resend.`);
    } catch (error) {
      console.error("Resend email send error:", error);
      console.log(`\n==========================================\n[DEVELOPMENT FALLBACK] Verification OTP for ${email}: ${code}\n==========================================\n`);
    }
  } else {
    console.log(`\n==========================================\n[DEVELOPMENT MODE] Verification OTP for ${email}: ${code}\n==========================================\n`);
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, department, year } = await req.json();

    if (!name || !email || !password || !department || !year) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!email.endsWith("@karunya.edu.in")) {
      return NextResponse.json({ error: "Only @karunya.edu.in email addresses are allowed." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.verified) {
        return NextResponse.json({ error: "User already exists with this email." }, { status: 400 });
      } else {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashedPassword,
            department,
            year: Number(year),
            otpCode,
            otpExpires,
          }
        });

        await sendOtpEmail(email, name, otpCode);

        return NextResponse.json({ message: "OTP sent. Please verify your email." });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department,
        year: Number(year),
        otpCode,
        otpExpires,
        verified: false
      }
    });

    await sendOtpEmail(email, name, otpCode);

    return NextResponse.json({ message: "Signup successful. Verification OTP sent." });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
