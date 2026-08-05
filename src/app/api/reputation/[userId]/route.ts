import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateUserReputation } from "@/lib/reputation/calculator";

async function fetchAndCalculateUserReputation(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      bio: true,
      githubUrl: true,
      linkedinUrl: true,
      year: true,
      skills: { select: { name: true } },
      projects: { select: { id: true } },
      applications: { select: { id: true } },
    },
  });

  if (!user) return null;

  return calculateUserReputation({
    userId: user.id,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    bio: user.bio,
    year: user.year,
    skills: user.skills,
    userProjectsCount: user.projects?.length || 0,
    userApplicationsCount: user.applications?.length || 0,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: userIdStr } = await params;
    const userId = Number(userIdStr);

    if (isNaN(userId) || !userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const reputation = await fetchAndCalculateUserReputation(userId);
    if (!reputation) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(reputation);
  } catch (error: any) {
    console.error("GET reputation error:", error);
    return NextResponse.json({ error: "Failed to calculate reputation" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: userIdStr } = await params;
    const userId = Number(userIdStr);

    if (isNaN(userId) || !userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const currentUserId = Number((session.user as any).id);
    const isAdmin = (session.user as any).role === "ADMIN";

    if (currentUserId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reputation = await fetchAndCalculateUserReputation(userId);
    if (!reputation) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Reputation successfully resynced and calculated.",
      reputation,
    });
  } catch (error: any) {
    console.error("POST reputation error:", error);
    return NextResponse.json({ error: "Failed to sync reputation" }, { status: 500 });
  }
}
