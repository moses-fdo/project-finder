"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("colabro-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Default to OS system theme if no explicit user preference saved in localStorage
    const activeTheme: Theme =
      saved === "dark"
        ? "dark"
        : saved === "light"
        ? "light"
        : systemDark
        ? "dark"
        : "light";

    const root = document.documentElement;
    if (activeTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setTheme(activeTheme);

    // Listen to real-time OS system theme changes when no override is stored
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("colabro-theme");
      if (!stored) {
        const nextTheme: Theme = e.matches ? "dark" : "light";
        if (nextTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        setTheme(nextTheme);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("colabro-theme", next);
    setTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
