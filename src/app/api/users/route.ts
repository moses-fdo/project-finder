import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const take = 49;

    const users = await prisma.user.findMany({
      take,
      ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        year: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        profileImage: true,
        availability: true,
        skills: { select: { id: true, name: true } },
        projects: { select: { id: true, status: true } },
        applications: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasMore = users.length > 48;
    const items = users.slice(0, 48);
    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    return NextResponse.json({ users: items, nextCursor, hasMore });
  } catch (error) {
    console.error("[API users] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
