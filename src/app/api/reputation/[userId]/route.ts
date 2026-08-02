import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUserReputation } from "@/lib/reputation/calculator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params;
    const userId = Number(userIdStr);

    if (isNaN(userId) || !userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        year: true,
        skills: { select: { name: true } },
        projects: { select: { id: true } },
        applications: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reputation = await calculateUserReputation({
      userId: user.id,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      bio: user.bio,
      year: user.year,
      skills: user.skills,
      userProjectsCount: user.projects?.length || 0,
      userApplicationsCount: user.applications?.length || 0,
    });

    return NextResponse.json(reputation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to calculate reputation" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params;
    const userId = Number(userIdStr);

    if (isNaN(userId) || !userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        year: true,
        skills: { select: { name: true } },
        projects: { select: { id: true } },
        applications: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reputation = await calculateUserReputation({
      userId: user.id,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      bio: user.bio,
      year: user.year,
      skills: user.skills,
      userProjectsCount: user.projects?.length || 0,
      userApplicationsCount: user.applications?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: "Reputation successfully resynced and calculated.",
      reputation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to sync reputation" }, { status: 500 });
  }
}
