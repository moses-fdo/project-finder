"use client";

import { useState, useCallback, useRef } from "react";

export interface AbuseCheckResult {
  abusive: boolean;
  flaggedWords: string[];
  confidence: number;
}

interface UseAbuseCheckOptions {
  debounceMs?: number;
  failOpen?: boolean;
  userId?: number | null;
}

/**
 * Hook that provides on-submit abusive text checking.
 * Returns a function to check text, the loading state, and the last result.
 */
export function useAbuseCheck(options: UseAbuseCheckOptions = {}) {
  const { failOpen = true, userId } = options;
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<AbuseCheckResult | null>(null);
  const lastCheckRef = useRef<string>("");

  const checkText = useCallback(
    async (text: string): Promise<AbuseCheckResult> => {
      const trimmed = text.trim();
      if (!trimmed || trimmed === lastCheckRef.current) {
        return { abusive: false, flaggedWords: [], confidence: 0 };
      }

      setIsChecking(true);
      lastCheckRef.current = trimmed;

      try {
        const res = await fetch("/api/messages/check-abuse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });

        const result: AbuseCheckResult & { error?: string } = await res.json();

        const finalResult: AbuseCheckResult = {
          abusive: result.abusive || false,
          flaggedWords: result.flaggedWords || [],
          confidence: result.confidence || 0,
        };

        setLastResult(finalResult);

        // If abusive, log the attempt (without storing the text)
        if (finalResult.abusive && userId) {
          fetch("/api/messages/log-abuse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              reason: finalResult.flaggedWords.length > 0
                ? `flagged:${finalResult.flaggedWords.join(",")}`
                : "abusive_phrase",
            }),
          }).catch(() => {
            // Fire-and-forget, non-critical
          });
        }

        return finalResult;
      } catch {
        // Fail-open: if classifier is down, allow the message through
        if (failOpen) {
          return { abusive: false, flaggedWords: [], confidence: 0 };
        }
        return { abusive: true, flaggedWords: ["classifier_error"], confidence: 1 };
      } finally {
        setIsChecking(false);
      }
    },
    [userId, failOpen]
  );

  const reset = useCallback(() => {
    setLastResult(null);
    lastCheckRef.current = "";
  }, []);

  return {
    checkText,
    isChecking,
    lastResult,
    reset,
  };
}