"use client";

import Image from "next/image";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

interface ColabroLogoProps {
  size?: number;
}

export default function ColabroLogo({ size = 40 }: ColabroLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount, read directly from DOM class (set by the anti-flash inline script)
  // This prevents flicker on dark-mode page load
  const effectiveTheme = mounted
    ? theme
    : (typeof document !== "undefined" && document.documentElement.classList.contains("dark"))
      ? "dark"
      : "light";

  return (
    <Image
      src={effectiveTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
      alt="Colabro"
      width={size}
      height={size}
      className="shrink-0"
      style={{ borderRadius: "22%" }}
      priority
    />
  );
}
