import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST  → bookmark a project (idempotent)
// DELETE → remove bookmark
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const { id } = await params;
    const projectId = Number(id);

    if (isNaN(userId) || isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid IDs." }, { status: 400 });
    }

    // upsert so calling twice is safe
    await prisma.bookmark.upsert({
      where: { userId_projectId: { userId, projectId } },
      create: { userId, projectId },
      update: {},
    });

    return NextResponse.json({ bookmarked: true });
  } catch (err: any) {
    console.error("[bookmark POST]", err?.message);
    return NextResponse.json({ error: "Failed to bookmark." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const { id } = await params;
    const projectId = Number(id);

    if (isNaN(userId) || isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid IDs." }, { status: 400 });
    }

    await prisma.bookmark.deleteMany({
      where: { userId, projectId },
    });

    return NextResponse.json({ bookmarked: false });
  } catch (err: any) {
    console.error("[bookmark DELETE]", err?.message);
    return NextResponse.json({ error: "Failed to remove bookmark." }, { status: 500 });
  }
}
