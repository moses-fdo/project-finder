import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Cache words list for fast server-side fallback
let cachedLexicon: Set<string> | null = null;

function getLexicon(): Set<string> {
  if (cachedLexicon) return cachedLexicon;
  try {
    const filePath = path.join(process.cwd(), "words.csv");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const words = content
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 2);
      cachedLexicon = new Set(words);
      return cachedLexicon;
    }
  } catch (err) {
    console.error("Error loading words.csv fallback:", err);
  }
  cachedLexicon = new Set();
  return cachedLexicon;
}

export interface CheckAbuseResult {
  abusive: boolean;
  flaggedWords: string[];
  confidence: number;
}

/**
 * Server-side function to validate text for abusive content.
 * Calls Python classifier service, with automatic local JS fallback.
 * Automatically logs attempt to DB if abusive and userId is supplied.
 */
export async function checkAbuseServer(
  text: string,
  userId?: number | null
): Promise<CheckAbuseResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { abusive: false, flaggedWords: [], confidence: 0 };
  }

  let result: CheckAbuseResult = { abusive: false, flaggedWords: [], confidence: 0 };
  const CLASSIFIER_URL = process.env.CLASSIFIER_URL || "http://127.0.0.1:8000";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const res = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const flagged = data.flagged_words || [];
      result = {
        abusive: Boolean(data.abusive || flagged.length > 0),
        flaggedWords: flagged,
        confidence: data.confidence || 0,
      };
    } else {
      throw new Error(`Classifier HTTP ${res.status}`);
    }
  } catch {
    // Local fallback check using word boundary matching against words.csv
    const lexicon = getLexicon();
    const textLower = trimmed.toLowerCase();
    const flagged: string[] = [];

    for (const word of lexicon) {
      if (word.length < 2) continue;
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(textLower)) {
        flagged.push(word);
        if (flagged.length >= 10) break;
      }
    }

    if (flagged.length > 0) {
      result = {
        abusive: true,
        flaggedWords: flagged,
        confidence: 0.95,
      };
    }
  }

  // If abusive and userId is provided, log to AbusiveMessageLog
  if (result.abusive && userId) {
    try {
      await prisma.abusiveMessageLog.create({
        data: {
          userId,
          reason: result.flaggedWords.length > 0
            ? `flagged:${result.flaggedWords.join(",")}`
            : "abusive_phrase",
        },
      });
    } catch (err) {
      console.error("Failed to log abuse to DB:", err);
    }
  }

  return result;
}
