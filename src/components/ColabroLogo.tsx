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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Before mount (SSR & initial client hydration), default to "light" so HTML matches.
  // After mount (useEffect), update to the user's active theme.
  const effectiveTheme = mounted ? theme : "light";

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
