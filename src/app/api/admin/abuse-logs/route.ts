import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/abuse-logs
 * Returns logged blocked attempts for moderators.
 * Supports ?userId=N to filter, ?days=N for time range.
 * 
 * Never returns the actual message content — only userId, count, reason, timestamp.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = parseInt(userId, 10);
    }

    // Filter by date range
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.timestamp = { gte: since };

    const logs = await prisma.abusiveMessageLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 500),
      select: {
        id: true,
        userId: true,
        timestamp: true,
        reason: true,
        count: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Aggregate summary stats
    const totalBlocked = logs.reduce((sum, l) => sum + l.count, 0);
    const uniqueUsers = new Set(logs.map((l) => l.userId)).size;

    return NextResponse.json({
      logs,
      summary: {
        totalBlocked,
        uniqueUsers,
        totalEntries: logs.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch abuse logs:", message);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/abuse-logs
 * Clears logged blocked attempts.
 * Supports ?id=N to delete a single log, or deletes all if no ID is provided.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      await prisma.abusiveMessageLog.deleteMany();
      return NextResponse.json({ message: "All logs cleared successfully" });
    }

    await prisma.abusiveMessageLog.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Log cleared successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to delete abuse log:", message);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}