import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hackathons = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(hackathons);
  } catch (error) {
    console.error("Get hackathons error:", error);
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

    const { title, description, date, location, teamSize, prize, link } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const hackathon = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: date ? date.trim() : "TBA",
        location: location ? location.trim() : null,
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
          link: "/dashboard?tab=hackathons",
        })),
      });
    }

    return NextResponse.json({ message: "Hackathon created successfully.", hackathon });
  } catch (error) {
    console.error("Create hackathon error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
