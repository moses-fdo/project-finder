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

    const allowedEmails = await prisma.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(allowedEmails);
  } catch (error: any) {
    console.error("Get allowed emails error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { email, note } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Basic email format check
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.allowedEmail.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: `${cleanEmail} is already on the allowed emails list.` }, { status: 400 });
    }

    const allowedEntry = await prisma.allowedEmail.create({
      data: {
        email: cleanEmail,
        note: note ? note.trim() : null,
        addedBy: currentUser.email || currentUser.name || "Admin",
      },
    });

    return NextResponse.json({
      message: `Successfully added ${cleanEmail} to allowed emails!`,
      allowedEmail: allowedEntry,
    });
  } catch (error: any) {
    console.error("Create allowed email error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const emailParam = searchParams.get("email");

    if (id) {
      await prisma.allowedEmail.delete({
        where: { id: Number(id) },
      });
      return NextResponse.json({ message: "Allowed email removed." });
    }

    if (emailParam) {
      await prisma.allowedEmail.delete({
        where: { email: emailParam.toLowerCase().trim() },
      });
      return NextResponse.json({ message: "Allowed email removed." });
    }

    return NextResponse.json({ error: "ID or email parameter required." }, { status: 400 });
  } catch (error: any) {
    console.error("Delete allowed email error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
