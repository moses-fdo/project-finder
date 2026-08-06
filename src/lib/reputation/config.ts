export interface ReputationTier {
  min: number;
  name: "Beginner" | "Growing" | "Strong" | "Excellent" | "Elite";
  stars: number;
  badgeColor: string;
  description: string;
}

export const REPUTATION_CONFIG = {
  // Category weights summing to 1.0 (100%)
  weights: {
    github: 0.70,        // 70% primary coding activity
    experience: 0.15,    // 15% professional engineering roles
    certifications: 0.10,// 10% verified industry certifications
    community: 0.05,     // 5% meaningful tech community contributions
  },

  // Developer Reputation Level Tiers (Harsh Calibration)
  tiers: [
    {
      min: 88,
      name: "Elite",
      stars: 5.0,
      badgeColor: "purple",
      description: "Top 1% engineer: exceptional recent GitHub velocity, code reviews & high-impact repos.",
    },
    {
      min: 70,
      name: "Excellent",
      stars: 4.5,
      badgeColor: "emerald",
      description: "High-performing developer with consistent, verified recent activity & quality projects.",
    },
    {
      min: 50,
      name: "Strong",
      stars: 3.8,
      badgeColor: "blue",
      description: "Active contributor with recent project commits and solid technical skills.",
    },
    {
      min: 25,
      name: "Growing",
      stars: 2.8,
      badgeColor: "amber",
      description: "Developing engineer building early activity on GitHub and campus projects.",
    },
    {
      min: 0,
      name: "Beginner",
      stars: 1.8,
      badgeColor: "slate",
      description: "Early-stage developer with minimal or dormant recent contributions.",
    },
  ] as ReputationTier[],

  // Recognized industry certification providers
  recognizedCertProviders: [
    "OpenAI",
    "Google",
    "AWS",
    "Microsoft",
    "Meta",
    "Cisco",
    "NVIDIA",
    "IBM",
    "Coursera",
    "Oracle",
    "Linux Foundation",
  ],

  // Anti-Gaming & Harsh Algorithm Parameters
  antiGaming: {
    staleDataThresholdHours: 24, // TTL threshold for cached reputation score (24 hours)
    halfLifeDays: 30, // 30-day exponential decay half-life (recent activity counts for majority of points)
    maxDailyCommitsThreshold: 15, // Penalizes single-day commit bursts above 15 commits
    maxCertScore: 100, // Caps cert contribution
    maxRepoQualityScore: 100,
    campusCompletedProjectBonus: 8, // Points added per completed campus project on Project Finder
    spamCommitKeywords: [
      "update",
      "wip",
      "fix",
      "test",
      "patch",
      "temp",
      "bump",
      "merge",
      ".",
      "asdf",
    ],
    minCommitMessageLength: 8,
  },
};

export function getTierColorClass(tier?: string | null): string {
  if (!tier) return "bg-secondary text-muted-foreground border-border";
  switch (tier.toLowerCase()) {
    case "elite":
      return "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/30";
    case "excellent":
      return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30";
    case "strong":
      return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/30";
    case "growing":
      return "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}
