import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/messages/log-abuse
 * Logs a blocked abusive message attempt (without storing the abusive text).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason } = body;

    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        { error: "Valid userId is required" },
        { status: 400 }
      );
    }

    // Upsert: if same user already has a log for today, increment count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.abusiveMessageLog.findFirst({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existing) {
      await prisma.abusiveMessageLog.update({
        where: { id: existing.id },
        data: { count: existing.count + 1, reason: reason || existing.reason },
      });
    } else {
      await prisma.abusiveMessageLog.create({
        data: {
          userId,
          reason: reason || "unknown",
          count: 1,
        },
      });
    }

    return NextResponse.json({ logged: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to log abusive attempt:", message);
    return NextResponse.json(
      { error: "Failed to log attempt" },
      { status: 500 }
    );
  }
}