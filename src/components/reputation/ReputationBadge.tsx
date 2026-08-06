"use client";

import { Star, AlertCircle } from "lucide-react";
import { getTierColorClass } from "@/lib/reputation/config";

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
  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-[12.5px] px-3 py-1.5 gap-1.5"
      : "text-[11px] px-2.5 py-1 gap-1";

  const starSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;

  // If GitHub is NOT connected -> Not Rated state
  if (!githubConnected || score === null || score === undefined) {
    return (
      <div className={`inline-flex items-center rounded-full bg-secondary/80 border border-border text-muted-foreground font-semibold ${sizeClasses}`}>
        <AlertCircle size={starSize} className="text-muted-foreground/70" />
        <span>Not Rated</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border font-bold shadow-xs ${getTierColorClass(
        tier
      )} ${sizeClasses}`}
    >
      <Star size={starSize} className="fill-current" />
      <span>{stars.toFixed(1)}</span>
      <span className="opacity-70 font-normal">({score})</span>
      <span className="ml-0.5 uppercase text-[9px] tracking-wider font-extrabold">{tier}</span>
    </div>
  );
}
