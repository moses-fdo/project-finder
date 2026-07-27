"use client";

import { useEffect, useRef, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isDark, setIsDark] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number | null>(null);
  const clickRef = useRef(false);

  useEffect(() => {
    // Only enable on fine-pointer devices (mouse/trackpad, not touch)
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    setMounted(true);

    // Sync dark-mode state for cursor colors
    const updateTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };

      // Detect if mouse moved outside window bounds
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth - 1 ||
        e.clientY >= window.innerHeight - 1
      ) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    };

    const onDown = (e: MouseEvent) => {
      clickRef.current = true;
      const r: Ripple = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setRipples((p) => [...p.slice(-8), r]);
      setTimeout(() => setRipples((p) => p.filter((x) => x.id !== r.id)), 500);
    };

    const onUp = () => {
      clickRef.current = false;
    };

    const onMouseLeave = (e: MouseEvent) => {
      // If relatedTarget is null or mouse left the document viewport, hide cursor
      if (!e.relatedTarget || (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        setVisible(false);
      }
    };

    const onMouseEnter = () => {
      setVisible(true);
    };

    const onBlur = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const loop = () => {
      if (mainRef.current) {
        const scale = clickRef.current ? 0.82 : 1;
        mainRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) scale(${scale})`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!mounted) return null;

  // Light mode: black arrow with white halo outline
  // Dark mode: white arrow with black halo outline
  const fill = isDark ? "#ffffff" : "#0a0a0a";
  const outline = isDark ? "#000000" : "#ffffff";

  return (
    <>
      {/* Custom Cursor Element */}
      <div
        ref={mainRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform, opacity",
          opacity: visible ? 1 : 0,
          transition: "transform 0.01s ease-out, opacity 0.15s ease-out",
        }}
      >
        <svg
          width={22}
          height={26}
          viewBox="0 0 20 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          {/* Contrast halo outline */}
          <path
            d="M2 1.2 L2 20.5 L7.4 15.1 L10.8 22.5 L13.6 21.2 L10.2 13.8 L17 13.8 Z"
            fill={outline}
            stroke={outline}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Main arrow */}
          <path
            d="M2 1.2 L2 20.5 L7.4 15.1 L10.8 22.5 L13.6 21.2 L10.2 13.8 L17 13.8 Z"
            fill={fill}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Click ripples */}
      {visible &&
        ripples.map((r) => (
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
