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

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the stored reputation row without triggering GitHub sync
    const stored = await prisma.userReputation.findUnique({ where: { userId } });
    if (!stored) {
      return NextResponse.json({
        userId,
        githubConnected: false,
        score: null,
        stars: 0,
        tier: "Not Rated",
        tierDescription: "Connect your GitHub account to unlock your Developer Reputation score.",
        badgeColor: "slate",
        githubVerified: false,
        linkedinVerified: false,
        categoryScores: { github: 0, experience: 0, certifications: 0, community: 0 },
        details: {},
        lastSyncedAt: null,
      });
    }

    return NextResponse.json({
      userId: stored.userId,
      githubConnected: stored.githubConnected,
      score: stored.githubConnected ? stored.score : null,
      stars: stored.stars,
      tier: stored.githubConnected ? stored.tier : "Not Rated",
      tierDescription: "",
      badgeColor: "",
      githubVerified: stored.githubVerified,
      linkedinVerified: stored.linkedinVerified,
      categoryScores: {
        github: stored.githubScore,
        experience: stored.experienceScore,
        certifications: stored.certificationScore,
        community: stored.communityScore,
      },
      details: stored.breakdownJson ?? {},
      lastSyncedAt: stored.lastSyncedAt,
    });
  } catch (error: any) {
    console.error("GET reputation error:", error);
    return NextResponse.json({ error: "Failed to get reputation" }, { status: 500 });
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

    if (!Number.isInteger(userId) || userId <= 0) {
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
