"use client";

import { Star, AlertCircle, ShieldCheck } from "lucide-react";

interface ReputationBadgeProps {
  score?: number | null;
  stars?: number;
  tier?: string;
  githubConnected?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ReputationBadge({
  score,
  stars = 0,
  tier = "Not Rated",
  githubConnected = false,
  size = "md",
}: ReputationBadgeProps) {
  // If GitHub is NOT connected -> Not Rated state
  if (!githubConnected || score === null || score === undefined) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-muted-foreground text-[10.5px] font-semibold">
        <AlertCircle size={12} className="text-muted-foreground/70" />
        <span>Not Rated</span>
      </div>
    );
  }

  const getTierColorClass = (t: string) => {
    switch (t.toLowerCase()) {
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
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-xs ${getTierColorClass(tier)}`}>
        <Star size={12} className="fill-current" />
        <span>{stars.toFixed(1)}</span>
        <span className="opacity-70 font-normal">({score})</span>
        <span className="ml-1 uppercase text-[9px] tracking-wider font-extrabold">{tier}</span>
      </div>
    </div>
  );
}
