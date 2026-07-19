import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hackathons = await prisma.hackathon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(hackathons);
  } catch (error: any) {
    console.error("Get hackathons error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || (currentUser as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { title, description, date, location, teamSize, prize, link } = await req.json();

    if (!title || !description || !date || !location) {
      return NextResponse.json({ error: "Title, description, date, and location are required." }, { status: 400 });
    }

    const hackathon = await prisma.hackathon.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        location: location.trim(),
        teamSize: teamSize ? teamSize.trim() : "1 - 4 Members",
        prize: prize ? prize.trim() : null,
        link: link ? link.trim() : null,
      },
    });

    // Notify all users about the new hackathon
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          message: `🏆 New Hackathon Announced: ${hackathon.title}!`,
        })),
      });
    }

    return NextResponse.json({ message: "Hackathon created successfully.", hackathon });
  } catch (error: any) {
    console.error("Create hackathon error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
