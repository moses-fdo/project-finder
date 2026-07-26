import { NextRequest, NextResponse } from "next/server";
import { checkAbuseServer } from "@/lib/moderation";

/**
 * POST /api/moderation/check-abuse
 * Checks if text is abusive using classifier microservice + server-side lexicon fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, userId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text exceeds maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    const result = await checkAbuseServer(text, userId ? Number(userId) : null);

    return NextResponse.json({
      abusive: result.abusive,
      flaggedWords: result.flaggedWords,
      confidence: result.confidence,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Abuse check route error:", message);

    return NextResponse.json({
      abusive: false,
      flaggedWords: [],
      confidence: 0,
      error: "Abuse check failed",
    });
  }
}

