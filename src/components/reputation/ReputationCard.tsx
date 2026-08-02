"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  GitBranch,
  Link2,
  Award,
  Users,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
  Zap,
  Lock,
} from "lucide-react";
import Toast from "@/components/Toast";

interface ReputationCardProps {
  reputation: {
    userId: number;
    githubConnected: boolean;
    score: number | null;
    stars: number;
    tier: string;
    tierDescription?: string;
    badgeColor?: string;
    githubVerified?: boolean;
    linkedinVerified?: boolean;
    categoryScores?: {
      github: number;
      experience: number;
      certifications: number;
      community: number;
    };
    details?: any;
    lastSyncedAt?: Date | string;
  };
  isCurrentUser?: boolean;
  onRefresh?: () => void;
}

export default function ReputationCard({
  reputation,
  isCurrentUser = false,
  onRefresh,
}: ReputationCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setErrorMessage("");
      setSyncMessage("");

      const res = await fetch(`/api/reputation/${reputation.userId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync reputation");
      }

      setSyncMessage("Reputation score successfully resynced!");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setErrorMessage(e.message || "Error syncing reputation");
    } finally {
      setSyncing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. UNCONNECTED STATE (GitHub NOT connected)
  // ─────────────────────────────────────────────────────────────
  if (!reputation.githubConnected || reputation.score === null) {
    return (
      <div className="card p-6 border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 space-y-5 relative overflow-hidden">
        {syncMessage && <Toast message={syncMessage} type="success" onClose={() => setSyncMessage("")} />}
        {errorMessage && <Toast message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                <Lock size={11} /> Unlocked via GitHub
              </span>
            </div>
            <h3 className="text-[18px] font-bold text-foreground tracking-tight">Developer Reputation Score</h3>
          </div>
          <div className="text-right">
            <span className="text-[14px] font-extrabold px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
              Not Rated
            </span>
          </div>
        </div>

        {/* Empty Stars Visual */}
        <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground/40">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={22} className="stroke-muted-foreground/40 fill-none" />
            ))}
            <span className="ml-2 text-[13px] font-bold text-muted-foreground">0.0 / 5.0 Stars</span>
          </div>
          {isCurrentUser && (
            <Link
              href="/dashboard?tab=profile"
              className="btn-primary py-2 px-4 text-[12px] font-bold shrink-0 inline-flex items-center gap-1.5 rounded-lg shadow-xs"
            >
              <GitBranch size={15} /> Connect GitHub Account
            </Link>
          )}
        </div>

        <div className="space-y-2 text-[12px] text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">
            Connect your GitHub account to unlock your verified Developer Reputation score.
          </p>
          <p>
            Project Finder calculates reputation objectively using verified commit history, merged pull requests, repository quality, professional experience, and recognized industry certifications.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent" /> GitHub Activity (70%)</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent" /> Experience (15%)</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent" /> Certifications (10%)</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent" /> Community (5%)</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CONNECTED STATE (Verified Reputation Score)
  // ─────────────────────────────────────────────────────────────
  const scores = reputation.categoryScores || {
    github: 70,
    experience: 15,
    certifications: 10,
    community: 5,
  };

  const getTierColorClass = (t: string) => {
    switch (t?.toLowerCase()) {
      case "elite": return "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/30";
      case "excellent": return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30";
      case "strong": return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/30";
      case "growing": return "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30";
      default: return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <div className="card p-6 space-y-6 border-border/80 bg-card shadow-xs relative overflow-hidden">
      {syncMessage && <Toast message={syncMessage} type="success" onClose={() => setSyncMessage("")} />}
      {errorMessage && <Toast message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10.5px] font-extrabold uppercase px-3 py-0.5 rounded-full border ${getTierColorClass(reputation.tier)}`}>
              {reputation.tier} Tier
            </span>
            {reputation.githubVerified && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> GitHub Verified
              </span>
            )}
            {reputation.linkedinVerified && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 inline-flex items-center gap-1">
                <Link2 size={11} /> LinkedIn Verified
              </span>
            )}
          </div>
          <h3 className="text-[18px] font-bold text-foreground tracking-tight">Developer Reputation Score</h3>
        </div>

        {/* Score Ring / Gauge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[32px] font-black text-foreground leading-none tracking-tight">
              {reputation.score}<span className="text-[16px] text-muted-foreground font-normal">/100</span>
            </div>
            <div className="flex items-center gap-1 mt-1 justify-end text-amber-500 dark:text-amber-400">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <Star
                  key={starIndex}
                  size={14}
                  className={starIndex <= Math.round(reputation.stars) ? "fill-current" : "stroke-muted-foreground/40 fill-none"}
                />
              ))}
              <span className="text-[11px] font-bold text-foreground ml-1">{reputation.stars.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Score Breakdown Bars */}
      <div className="space-y-3.5">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Category Score Breakdown</h4>

        {/* GitHub 70% */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px] font-semibold">
            <span className="flex items-center gap-1.5 text-foreground"><GitBranch size={13} className="text-accent" /> GitHub Code Activity (70% Weight)</span>
            <span className="text-accent font-bold">{scores.github}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${scores.github}%` }} />
          </div>
        </div>

        {/* Experience 15% */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px] font-semibold">
            <span className="flex items-center gap-1.5 text-foreground"><Link2 size={13} className="text-blue-500" /> Professional Experience (15% Weight)</span>
            <span className="text-blue-500 font-bold">{scores.experience}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${scores.experience}%` }} />
          </div>
        </div>

        {/* Certifications 10% */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px] font-semibold">
            <span className="flex items-center gap-1.5 text-foreground"><Award size={13} className="text-emerald-500" /> Verified Certifications (10% Weight)</span>
            <span className="text-emerald-500 font-bold">{scores.certifications}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${scores.certifications}%` }} />
          </div>
        </div>

        {/* Community 5% */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px] font-semibold">
            <span className="flex items-center gap-1.5 text-foreground"><Users size={13} className="text-amber-500" /> Community Contributions (5% Weight)</span>
            <span className="text-amber-500 font-bold">{scores.community}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${scores.community}%` }} />
          </div>
        </div>
      </div>

      {/* Tech Stack Mastery Pills */}
      {reputation.details?.github?.techStackProficiency && reputation.details.github.techStackProficiency.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Zap size={13} className="text-accent" /> Verified Tech Stack Mastery
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {reputation.details.github.techStackProficiency.map((tech: any) => (
              <span
                key={tech.language}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-foreground inline-flex items-center gap-1.5"
              >
                <span>{tech.language}</span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  tech.level === "Expert" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                  tech.level === "Proficient" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}>
                  {tech.level}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Anti-Gaming Details & Sync Trigger */}
      <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Anti-gaming spam filter active • Time-decay weighted</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span>Synced: {new Date(reputation.lastSyncedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          {isCurrentUser && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="btn-secondary text-[11px] py-1 px-3 inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing…" : "Sync Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
