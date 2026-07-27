import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAbuseServer } from "@/lib/moderation";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to create a project." },
        { status: 401 }
      );
    }

    const {
      title,
      description,
      skills,
      category,
      projectType,
      experienceLevel,
      teamSize,
      duration,
    } = await req.json();

    if (!title || !description || !skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Title, description, and skills are required." },
        { status: 400 }
      );
    }

    const currentUserId = Number((currentUser as any).id);

    // ── Server-side moderation check ──
    const combinedContent = [title, description, skills.join(" ")].filter(Boolean).join(" ");
    const abuseResult = await checkAbuseServer(combinedContent, currentUserId);

    if (abuseResult.abusive) {
      return NextResponse.json(
        {
          error: "Your project contains inappropriate language and cannot be published.",
          flaggedWords: abuseResult.flaggedWords,
        },
        { status: 400 }
      );
    }

    const skillObjects = await Promise.all(
      skills.map(async (name: string) => {
        const cleanName = name.trim();
        return await prisma.skill.upsert({
          where: { name: cleanName },
          update: {},
          create: { name: cleanName },
        });
      })
    );

    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: "OPEN",
        ownerId: currentUserId,
        category:        category        || null,
        projectType:     projectType     || null,
        experienceLevel: experienceLevel || null,
        teamSize:        teamSize        ? Number(teamSize) : null,
        duration:        duration        || null,
        skills: {
          connect: skillObjects.map((s) => ({ id: s.id })),
        },
      },
      include: { skills: true },
    });

    return NextResponse.json({ message: "Project created successfully.", project });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
