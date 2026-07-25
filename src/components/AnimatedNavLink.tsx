"use client"

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AnimatedNavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      gsap.set(linkRef.current, { y: 10, opacity: 0 });
      gsap.to(linkRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.1,
      });
    }
  }, []);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}
