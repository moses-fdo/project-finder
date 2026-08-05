/**
 * Developer Reputation Utilities & Unified Single Source of Truth
 * Standardized continuous score, star rating, and tier derivation across Profile, Collaborators Directory, and Leaderboard.
 */

import { collectExperienceMetrics } from "./collectors/experienceCollector";
import { collectCertificationMetrics } from "./collectors/certificationCollector";
import { collectCommunityMetrics } from "./collectors/communityCollector";
import { REPUTATION_CONFIG } from "./config";

export interface UserReputationSummary {
  githubConnected: boolean;
  score: number | null;
  stars: number;
  tier: "Not Rated" | "Beginner" | "Growing" | "Strong" | "Excellent" | "Elite";
}

export function extractHandle(url?: string | null): string {
  if (!url) return "dev";
  const clean = url.trim().replace(/\/+$/, "");
  if (clean.includes("github.com/")) {
    return clean.split("github.com/")[1]?.split("/")[0] || "dev";
  }
  return clean.replace(/^@/, "");
}

/**
 * Single source of truth for GitHub score calculation when API is fallback/un-synced.
 * Uses the SAME hash algorithm and score formula as calculateFallbackGitHubMetrics in
 * githubCollector.ts so collaborators page and profile page produce identical fallback scores.
 */
export function calculateDeterministicGitHubScore(githubUrl?: string | null, _userId?: number | string, _projectsCount = 0): number {
  const ghUrl = githubUrl?.trim();
  if (!ghUrl || ghUrl.length < 5) return 0;
  const username = extractHandle(ghUrl);
  // Mirror githubCollector.ts calculateFallbackGitHubMetrics hash exactly
  const hash = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.min(Math.max(18 + (hash % 38), 18), 58);
}

/**
 * Smooth, continuous 1.5 to 5.0 star rating derived directly from Developer Reputation Score (0 - 100).
 * Every distinct score produces its own unique star rating.
 */
export function deriveStarsFromScore(score: number): number {
  if (!score || score <= 0) return 0;
  const clamped = Math.min(Math.max(score, 0), 100);
  const rawStars = 1.5 + (clamped / 100) * 3.5;
  return Number(rawStars.toFixed(1));
}

export function deriveTierFromScore(score: number): "Beginner" | "Growing" | "Strong" | "Excellent" | "Elite" {
  const matched = REPUTATION_CONFIG.tiers.find((t) => score >= t.min);
  return matched ? matched.name : "Beginner";
}

/**
 * Unified Reputation Calculation function for any user object.
 */
export function getDeveloperReputation(user: {
  id?: number | string;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  year?: number | null;
  reputation?: {
    score?: number | null;
    stars?: number | null;
    tier?: string | null;
    githubConnected?: boolean | null;
  } | null;
  name?: string | null;
  email?: string | null;
  skills?: any[];
  projects?: any[];
  applications?: any[];
}): UserReputationSummary {
  if (!user) {
    return { githubConnected: false, score: null, stars: 0, tier: "Not Rated" };
  }

  // 1. Check if DB reputation record exists and is synced
  if (user.reputation && typeof user.reputation.score === "number") {
    const isConn = Boolean(user.reputation.githubConnected);
    if (!isConn) {
      return { githubConnected: false, score: null, stars: 0, tier: "Not Rated" };
    }
    const rawScore = user.reputation.score;
    const rawStars = typeof user.reputation.stars === "number" ? user.reputation.stars : deriveStarsFromScore(rawScore);
    const VALID_TIERS = ["Beginner", "Growing", "Strong", "Excellent", "Elite"] as const;
    const storedTier = user.reputation.tier as string;
    const rawTier: typeof VALID_TIERS[number] = VALID_TIERS.includes(storedTier as any)
      ? (storedTier as typeof VALID_TIERS[number])
      : deriveTierFromScore(rawScore);
    return {
      githubConnected: true,
      score: Math.round(rawScore),
      stars: Number(rawStars.toFixed(1)),
      tier: rawTier,
    };
  }

  // 2. Check if GitHub URL is present
  const ghUrl = user.githubUrl?.trim();
  const hasGithub = Boolean(ghUrl && ghUrl.length > 5);

  if (!hasGithub) {
    return {
      githubConnected: false,
      score: null,
      stars: 0,
      tier: "Not Rated",
    };
  }

  // 3. Compute Category Metrics
  const ghScore = calculateDeterministicGitHubScore(ghUrl, user.id, user.projects?.length || 0);
  const experience = collectExperienceMetrics(user.linkedinUrl, user.bio, user.year);
  const certs = collectCertificationMetrics(user.linkedinUrl, user.skills, user.bio);
  const community = collectCommunityMetrics(
    user.linkedinUrl,
    user.projects?.length || 0,
    user.applications?.length || 0,
    user.bio
  );

  // 4. Compute Weighted Score (GitHub 70%, Experience 15%, Certifications 10%, Community 5%)
  const weightedScore =
    ghScore * REPUTATION_CONFIG.weights.github +
    experience.score * REPUTATION_CONFIG.weights.experience +
    certs.score * REPUTATION_CONFIG.weights.certifications +
    community.score * REPUTATION_CONFIG.weights.community;

  const finalScore = Math.min(Math.max(Math.round(weightedScore), 0), 100);
  const stars = deriveStarsFromScore(finalScore);
  const tier = deriveTierFromScore(finalScore);

  return {
    githubConnected: true,
    score: finalScore,
    stars,
    tier,
  };
}
