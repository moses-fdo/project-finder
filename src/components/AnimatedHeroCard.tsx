"use client"

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function AnimatedHeroCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useGSAP(
    () => {
      if (cardRef.current) {
        gsap.set(cardRef.current, { y: -30, opacity: 0 });
        gsap.to(cardRef.current, {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
        });
      }
    },
    { scope: "hero-card" }
  );

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        transform: `
          translate3d(0, 0, 0)
          rotateX(${position.y * 0.05}deg)
          rotateY(${position.x * -0.05}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  );
}
