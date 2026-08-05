import { extractLinkedInHandle } from "./experienceCollector";

/**
 * Community Contributions Collector (5% Weight)
 * Evaluates technical community engagement, mentorship, articles, and hackathons from LinkedIn & campus activity.
 */

export interface CommunityCollectorResult {
  score: number; // 0 - 100
  details: {
    hasLinkedIn: boolean;
    hackathonsParticipated: number;
    openSourceProjectsContributed: number;
    technicalArticlesCount: number;
    mentoringActivity: boolean;
  };
}

export function collectCommunityMetrics(
  linkedinUrl: string | null | undefined,
  userProjectsCount: number,
  userApplicationsCount: number,
  bio: string | null | undefined
): CommunityCollectorResult {
  const handle = extractLinkedInHandle(linkedinUrl);
  const hasLinkedIn = Boolean(handle);

  const bioLower = (bio || "").toLowerCase();

  const hackathonsParticipated = userProjectsCount + (/\bhackathon\b/i.test(bioLower) ? 1 : 0);
  const openSourceProjectsContributed = userApplicationsCount;
  const technicalArticlesCount = (/\b(article|medium|blog)\b/i.test(bioLower)) ? 1 : 0;
  const mentoringActivity = /\b(mentor|president|ta|lead)\b/i.test(bioLower);

  if (!hasLinkedIn) {
    // Basic campus score without LinkedIn
    const unlinkedScore = Math.min(15 + hackathonsParticipated * 10 + openSourceProjectsContributed * 5, 35);
    return {
      score: unlinkedScore,
      details: {
        hasLinkedIn: false,
        hackathonsParticipated,
        openSourceProjectsContributed,
        technicalArticlesCount,
        mentoringActivity,
      },
    };
  }

  // With LinkedIn connected: Base 30 pts + activity bonuses
  let rawScore = 30;
  rawScore += Math.min(hackathonsParticipated * 15, 35);
  rawScore += Math.min(openSourceProjectsContributed * 10, 20);
  if (technicalArticlesCount > 0) rawScore += 10;
  if (mentoringActivity) rawScore += 15;

  const finalScore = Math.min(Math.round(rawScore), 100);

  return {
    score: finalScore,
    details: {
      hasLinkedIn: true,
      hackathonsParticipated,
      openSourceProjectsContributed,
      technicalArticlesCount,
      mentoringActivity,
    },
  };
}
