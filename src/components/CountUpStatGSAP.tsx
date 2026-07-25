"use client"

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function CountUpStatGSAP({
  end,
  suffix = "",
  label,
  sub,
  icon,
}: {
  end: number;
  suffix?: string;
  label: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const statRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!statRef.current || !targetRef.current) return;

      // Animate counter on scroll
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target.querySelector("span"), {
                innerText: `0→${end}`,
                duration: 2,
                ease: "expo.out",
                snap: { innerText: 1 },
                modifiers: {
                  innerText: (v: string) => {
                    const num = parseInt(v.replace(/[→\s]/g, ""), 10);
                    return num.toLocaleString() + suffix;
                  },
                },
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      if (targetRef.current) {
        observer.observe(targetRef.current);
      }

      return () => {
        observer.disconnect();
      };
    },
    { scope: "countup-stat", dependencies: [end] }
  );

  return (
    <div
      ref={targetRef}
      className="text-center px-4 py-8 border-r border-border last:border-r-0"
      style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.04)" }}
    >
      {icon && (
        <div className="mx-auto mb-2 text-blue-600 dark:text-blue-400 h-6 w-6">{icon}</div>
      )}
      <p className="text-[3rem] font-extrabold text-foreground mb-1">
        <span ref={statRef}>0{suffix}</span>
      </p>
      <p className="text-[11px] font-semibold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
