"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpStatProps {
  /** Numeric end value, e.g. 850 */
  end: number;
  /** Optional suffix appended after the number, e.g. "+" or "k" */
  suffix?: string;
  /** Duration of the count-up in ms (default 1800) */
  duration?: number;
  /** Label below the number, e.g. "Active members" */
  label: string;
  /** Sub-label below the main label */
  sub: string;
  /** Icon to render above the number */
  icon: React.ReactNode;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function CountUpStat({
  end,
  suffix = "",
  duration = 1800,
  label,
  sub,
  icon,
}: CountUpStatProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();

          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setCount(Math.round(eased * end));

            if (progress < 1) {
              rafRef.current = requestAnimationFrame(tick);
            }
          };

          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, hasStarted]);

  // Format: if end >= 1000, show e.g. "2.4k" style by keeping the passed suffix
  const display = count.toLocaleString();

  return (
    <div ref={ref} className="px-4 sm:px-10 py-2 text-center">
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-secondary border border-border mb-4 mx-auto text-muted-foreground">
        {icon}
      </div>

      {/* Number row */}
      <div className="flex items-end justify-center gap-0.5">
        <span
          className="stat-number tabular-nums"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--foreground)",
            transition: "color 0.1s ease",
          }}
        >
          {display}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#ea580c",
              paddingBottom: "2px",
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      <p className="text-[12.5px] font-semibold text-foreground mt-2">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
