"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FiBell, FiUser, FiLogOut, FiGrid, FiPlus } from "react-icons/fi";

interface NavbarClientProps {
  user: any;
  unreadNotifications: number;
}

export default function NavbarClient({ user, unreadNotifications }: NavbarClientProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 relative" ref={profileRef}>
      {/* Notifications bell */}
      <Link
        href="/dashboard?tab=notifications"
        className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-all"
        title="View Notifications"
      >
        <FiBell className="text-xl" />
        {unreadNotifications > 0 && (
          <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadNotifications}
          </span>
        )}
      </Link>

      {/* Profile Avatar Button */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center gap-2 p-0.5 rounded-full border border-border bg-card hover:bg-secondary hover:border-muted-foreground transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-ring flex items-center justify-center text-sm font-bold text-white uppercase overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name || "Avatar"} className="h-full w-full object-cover" />
          ) : (
            (user.name || "U")[0]
          )}
        </div>
      </button>

      {/* Profile Dropdown Menu */}
      {profileOpen && (
        <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200 z-50">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-secondary text-primary-foreground border border-border">
              {user.role}
            </span>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <FiGrid className="text-base" />
            Dashboard
          </Link>

          <Link
            href="/dashboard?tab=profile"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <FiUser className="text-base" />
            My Profile
          </Link>

          <div className="border-t border-border my-1"></div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors text-left cursor-pointer"
          >
            <FiLogOut className="text-base" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
