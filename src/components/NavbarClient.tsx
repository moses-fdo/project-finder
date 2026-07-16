"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LayoutGrid, User, LogOut } from "lucide-react";
import Image from "next/image";

interface NavbarClientProps {
  user: any;
  unreadNotifications: number;
}

export default function NavbarClient({ user, unreadNotifications }: NavbarClientProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user.name || "U")[0].toUpperCase();

  return (
    <div className="flex items-center gap-1 relative" ref={profileRef}>

      {/* Notifications */}
      <Link
        href="/dashboard?tab=notifications"
        className="btn-ghost relative p-[7px]"
        title="Notifications"
        aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadNotifications > 0 && (
          <span className="absolute top-[5px] right-[5px] h-[7px] w-[7px] rounded-full bg-destructive" aria-hidden="true" />
        )}
      </Link>

      {/* Avatar button */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary border border-border hover:border-muted-foreground/40 overflow-hidden transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open profile menu"
        aria-expanded={profileOpen}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Avatar"}
            width={28}
            height={28}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[11px] font-semibold text-foreground">{initials}</span>
        )}
      </button>

      {/* Dropdown */}
      {profileOpen && (
        <div className="dropdown animate-fade-in absolute right-0 top-10 w-56 p-1.5 z-50">
          {/* User info */}
          <div className="px-3 py-2.5 mb-1">
            <p className="text-[13px] font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>

          <div className="h-px bg-border mx-1 mb-1" />

          <Link
            href="/dashboard"
            onClick={() => setProfileOpen(false)}
            className="nav-item w-full px-3 py-2 rounded-md text-[13px]"
          >
            <LayoutGrid size={14} strokeWidth={1.75} />
            Dashboard
          </Link>

          <Link
            href="/dashboard?tab=profile"
            onClick={() => setProfileOpen(false)}
            className="nav-item w-full px-3 py-2 rounded-md text-[13px]"
          >
            <User size={14} strokeWidth={1.75} />
            Profile settings
          </Link>

          <div className="h-px bg-border mx-1 my-1" />

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="nav-item w-full px-3 py-2 rounded-md text-[13px] text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer text-left"
          >
            <LogOut size={14} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
