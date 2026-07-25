"use client"

import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

export default function MagicButton({
  children,
  className = "",
  icon = true,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
  onClick?: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (btnRef.current) {
      const letters = btnRef.current.textContent?.split("") || [];
      btnRef.current.innerHTML = "";
      letters.forEach((letter, i) => {
        const span = document.createElement("span");
        span.textContent = letter;
        span.className = "inline-block transition-transform group-hover:-translate-y-1";
        gsap.set(span, { y: 20, opacity: 0 });
        btnRef.current?.appendChild(span);
        gsap.to(span, {
          y: 0,
          opacity: 1,
          delay: i * 0.05,
        });
      });
    }
  }, []);

  useEffect(() => {
    tlRef.current = gsap.timeline({
      defaults: { duration: 0.3, ease: "back.out(1.7)" },
    });

    if (btnRef.current) {
      tlRef.current
        .to(btnRef.current, { boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)" })
        .to(btnRef.current, { scale: 1.05 }, "+=0.2")
        .to(btnRef.current, { scale: 1 }, "+=0.2");
    }

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
      }
    };
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={`
        group relative
        inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-sm font-semibold
        overflow-hidden
        bg-purple-600 hover:bg-purple-700 text-white
        transition-all duration-200
        shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40
        active:scale-95
        ${className}
      `}
    >
      {children}
      {icon && (
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5"
        />
      )}
    </button>
  );
}
