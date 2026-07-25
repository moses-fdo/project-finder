"use client"

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto bg-card/90 backdrop-blur-lg border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground shrink-0"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[14px] font-semibold">Colabro</span>
            <span className="text-[12px] text-muted-foreground pl-4 border-l border-border">
              Campus Collaboration Platform
            </span>
          </div>

          <div className="flex items-center gap-6 text-muted-foreground">
            <span className="text-[12px] font-medium">
              © {new Date().getFullYear()}
            </span>
            <Link
              href="/login"
              className="text-[13px] font-medium hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-medium hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
