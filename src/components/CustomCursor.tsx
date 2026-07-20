"use client";

import { useEffect, useRef, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const mainRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    setIsVisible(true);

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onDown = (e: MouseEvent) => {
      setIsClicking(true);
      const r: Ripple = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setRipples((p) => [...p.slice(-8), r]);
      setTimeout(() => setRipples((p) => p.filter((x) => x.id !== r.id)), 500);
    };

    const onUp = () => setIsClicking(false);
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const loop = () => {
      if (mainRef.current) {
        mainRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${isClicking ? 0.88 : 1})`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isClicking]);

  if (!isVisible) return null;

  return (
    <>
      {/* ── Cursor — snaps exactly to mouse, no trail ── */}
      <div
        ref={mainRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
        }}
      >
        <ArrowSVG size={24} />
      </div>

      {/* ── Click ripple ── */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="click-ripple"
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        />
      ))}
    </>
  );
}

/** Filled rounded arrow cursor — matches the reference image */
function ArrowSVG({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* White halo for contrast on any background */}
      <path
        d="M2 1.2 L2 20.5 L7.4 15.1 L10.8 22.5 L13.6 21.2 L10.2 13.8 L17 13.8 Z"
        fill="white"
        stroke="white"
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Solid black arrow */}
      <path
        d="M2 1.2 L2 20.5 L7.4 15.1 L10.8 22.5 L13.6 21.2 L10.2 13.8 L17 13.8 Z"
        fill="#0a0a0a"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
