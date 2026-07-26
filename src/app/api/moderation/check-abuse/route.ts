import { NextRequest, NextResponse } from "next/server";

const CLASSIFIER_URL = process.env.CLASSIFIER_URL || "http://127.0.0.1:8000";

/**
 * POST /api/moderation/check-abuse
 * Calls the Python classifier microservice to check if text is abusive.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

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

    // Call the Python FastAPI classifier
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Classifier returned ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      abusive: result.abusive,
      flaggedWords: result.flagged_words,
      confidence: result.confidence,
    });
  } catch (error: unknown) {
    // If classifier is unreachable, allow the message through (fail-open)
    const message = error instanceof Error ? error.message : String(error);
    console.error("Abuse classifier error:", message);

    return NextResponse.json({
      abusive: false,
      flaggedWords: [],
      confidence: 0,
      error: "Classifier unavailable, message allowed",
    });
  }
}
