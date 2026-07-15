import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in to create a project." }, { status: 401 });
    }

    const { title, description, skills } = await req.json();

    if (!title || !description || !skills || !Array.isArray(skills)) {
      return NextResponse.json({ error: "Title, description, and skills are required." }, { status: 400 });
    }

    const currentUserId = Number((currentUser as any).id);

    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: "OPEN",
        ownerId: currentUserId,
        skills: {
          connectOrCreate: skills.map((name: string) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: {
        skills: true,
      },
    });

    return NextResponse.json({ message: "Project created successfully.", project });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
