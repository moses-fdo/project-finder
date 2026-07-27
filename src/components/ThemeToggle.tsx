"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : "light";

  return (
    <button
      onClick={toggle}
      aria-label={activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      style={{
        background: "var(--secondary)",
      }}
    >
      {activeTheme === "dark" ? (
        <Sun size={14} strokeWidth={2} />
      ) : (
        <Moon size={14} strokeWidth={2} />
      )}
    </button>
  );
}
