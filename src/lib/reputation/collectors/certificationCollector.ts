import { REPUTATION_CONFIG } from "../config";
import { extractLinkedInHandle } from "./experienceCollector";

/**
 * Verified Certifications Collector (10% Weight)
 * Evaluates industry certifications and credentials from connected LinkedIn profile & skills.
 */

export interface CertificationCollectorResult {
  score: number; // 0 - 100
  details: {
    hasLinkedIn: boolean;
    totalRecognizedCerts: number;
    matchedProviders: string[];
    capped: boolean;
  };
}

export function collectCertificationMetrics(
  linkedinUrl: string | null | undefined,
  skills: any[] | undefined,
  bio: string | null | undefined
): CertificationCollectorResult {
  const handle = extractLinkedInHandle(linkedinUrl);
  const hasLinkedIn = Boolean(handle);

  const bioText = (bio || "").toLowerCase();
  const skillNames = (skills || [])
    .map((s) => (typeof s === "string" ? s : s?.name))
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.toLowerCase());
  const combinedText = `${bioText} ${skillNames.join(" ")}`;

  const matchedProviders: string[] = [];

  for (const provider of REPUTATION_CONFIG.recognizedCertProviders) {
    const regex = new RegExp(`\\b${provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(combinedText)) {
      matchedProviders.push(provider);
    }
  }

  const totalRecognizedCerts = matchedProviders.length;

  if (!hasLinkedIn) {
    // If LinkedIn is not connected, score is low/zero unless explicitly verified
    const unlinkedScore = totalRecognizedCerts > 0 ? Math.min(totalRecognizedCerts * 15, 30) : 0;
    return {
      score: unlinkedScore,
      details: {
        hasLinkedIn: false,
        totalRecognizedCerts,
        matchedProviders,
        capped: false,
      },
    };
  }

  // With LinkedIn connected: Base 20 pts + 25 pts per recognized certification
  const rawScore = 20 + totalRecognizedCerts * 25;
  const score = Math.min(rawScore, REPUTATION_CONFIG.antiGaming.maxCertScore);

  return {
    score,
    details: {
      hasLinkedIn: true,
      totalRecognizedCerts,
      matchedProviders,
      capped: rawScore > REPUTATION_CONFIG.antiGaming.maxCertScore,
    },
  };
}
