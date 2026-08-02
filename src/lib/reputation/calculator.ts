import { REPUTATION_CONFIG, ReputationTier } from "./config";
import { collectGitHubMetrics, GitHubCollectorResult } from "./collectors/githubCollector";
import { collectExperienceMetrics, ExperienceCollectorResult } from "./collectors/experienceCollector";
import { collectCertificationMetrics, CertificationCollectorResult } from "./collectors/certificationCollector";
import { collectCommunityMetrics, CommunityCollectorResult } from "./collectors/communityCollector";
import { deriveStarsFromScore, deriveTierFromScore } from "./utils";

export interface CalculateReputationInput {
  userId: number;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  year?: number | null;
  skills?: any[];
  userProjectsCount?: number;
  userApplicationsCount?: number;
  completedProjectsCount?: number;
}

export interface CalculatedReputationResult {
  userId: number;
  githubConnected: boolean;
  score: number | null; // null if GitHub is not connected
  stars: number; // 0 if not connected
  tier: string; // "Not Rated" if not connected, else "Beginner" | "Growing" | "Strong" | "Excellent" | "Elite"
  tierDescription: string;
  badgeColor: string;
  githubVerified: boolean;
  linkedinVerified: boolean;
  categoryScores: {
    github: number;
    experience: number;
    certifications: number;
    community: number;
  };
  details: {
    github: GitHubCollectorResult["details"];
    experience: ExperienceCollectorResult["details"];
    certifications: CertificationCollectorResult["details"];
    community: CommunityCollectorResult["details"];
  };
  lastSyncedAt: Date;
}

export async function calculateUserReputation(
  input: CalculateReputationInput
): Promise<CalculatedReputationResult> {
  const githubMetrics = await collectGitHubMetrics(input.githubUrl);
  const experienceMetrics = collectExperienceMetrics(input.linkedinUrl, input.bio, input.year);
  const certMetrics = collectCertificationMetrics(input.linkedinUrl, input.skills, input.bio);
  const communityMetrics = collectCommunityMetrics(
    input.linkedinUrl,
    input.userProjectsCount || 0,
    input.userApplicationsCount || 0,
    input.bio
  );

  // RULE: If GitHub is NOT connected, developer is NOT RATED.
  if (!githubMetrics.connected) {
    return {
      userId: input.userId,
      githubConnected: false,
      score: null,
      stars: 0,
      tier: "Not Rated",
      tierDescription: "Connect your GitHub account to unlock your Developer Reputation score.",
      badgeColor: "slate",
      githubVerified: false,
      linkedinVerified: experienceMetrics.details.verifiedCompany,
      categoryScores: {
        github: 0,
        experience: experienceMetrics.score,
        certifications: certMetrics.score,
        community: communityMetrics.score,
      },
      details: {
        github: githubMetrics.details,
        experience: experienceMetrics.details,
        certifications: certMetrics.details,
        community: communityMetrics.details,
      },
      lastSyncedAt: new Date(),
    };
  }

  // Calculate Weighted Overall Reputation Score (0 - 100)
  const weightedScore =
    githubMetrics.score * REPUTATION_CONFIG.weights.github +
    experienceMetrics.score * REPUTATION_CONFIG.weights.experience +
    certMetrics.score * REPUTATION_CONFIG.weights.certifications +
    communityMetrics.score * REPUTATION_CONFIG.weights.community;

  const finalScore = Math.min(Math.max(Math.round(weightedScore), 0), 100);

  const stars = deriveStarsFromScore(finalScore);
  const tier = deriveTierFromScore(finalScore);
  const tierObj =
    REPUTATION_CONFIG.tiers.find((t) => t.name === tier) ||
    REPUTATION_CONFIG.tiers[REPUTATION_CONFIG.tiers.length - 1];

  return {
    userId: input.userId,
    githubConnected: true,
    score: finalScore,
    stars,
    tier,
    tierDescription: tierObj.description,
    badgeColor: tierObj.badgeColor,
    githubVerified: true,
    linkedinVerified: experienceMetrics.details.verifiedCompany,
    categoryScores: {
      github: githubMetrics.score,
      experience: experienceMetrics.score,
      certifications: certMetrics.score,
      community: communityMetrics.score,
    },
    details: {
      github: githubMetrics.details,
      experience: experienceMetrics.details,
      certifications: certMetrics.details,
      community: communityMetrics.details,
    },
    lastSyncedAt: new Date(),
  };
}
