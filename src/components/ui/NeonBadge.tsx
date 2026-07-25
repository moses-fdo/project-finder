"use client"

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NeonBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "success" | "danger" | "default";
}) {
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (badgeRef.current) {
      gsap.set(badgeRef.current, {
        boxShadow: "0 0 8px rgba(124, 58, 237, 0.4)",
      });
      const letters = badgeRef.current.textContent?.split("") || [];
      badgeRef.current.innerHTML = "";
      letters.forEach((letter) => {
        const span = document.createElement("span");
        span.textContent = letter;
        badgeRef.current?.appendChild(span);
      });
    }
  }, []);

  return (
    <span
      ref={badgeRef}
      className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium
        ${
          variant === "success"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
            : variant === "danger"
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
        }
        animate-pulse-slow`}
    >
      {children}
    </span>
  );
}
