"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Home as HomeIcon,
  FolderOpen,
  Search,
  Users,
  Trophy,
  Bookmark,
  Send,
  Mail,
  Inbox,
  MoreVertical,
  LogOut,
  Settings,
  Check,
  CheckCheck,
  ShieldAlert,
} from "lucide-react";

interface NotificationItem {
  id: number;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

interface AppShellProps {
  children: React.ReactNode;
  user: any;
  unreadNotifications?: number;
  inboxNotifications?: NotificationItem[];  // optional — omit on non-dashboard pages
}

// Stable empty array outside the component — never recreated
const EMPTY_NOTIFS: NotificationItem[] = [];

export default function AppShell({
  children,
  user,
  unreadNotifications = 0,
  inboxNotifications,
}: AppShellProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();

  // Stable reference: use prop if provided, otherwise the module-level constant
  const stableNotifs = inboxNotifications ?? EMPTY_NOTIFS;

  const [profileOpen, setProfileOpen] = useState(false);
  const [inboxOpen,   setInboxOpen]   = useState(false);
  const [localNotifs, setLocalNotifs] = useState<NotificationItem[]>(stableNotifs);

  const profileRef = useRef<HTMLDivElement>(null);
  const inboxRef   = useRef<HTMLDivElement>(null);

  const tab = searchParams.get("tab") || "home";

  /* ── close on outside click ────────────────────────────── */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (inboxRef.current   && !inboxRef.current.contains(e.target as Node))   setInboxOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // NOTE: No sync effect for inboxNotifications — useState initialiser captures
  // the value on first mount. Local read/mark operations mutate localNotifs directly.
  // A full refresh (router.refresh) will remount and re-initialise with fresh data.

  const initials     = (user?.name || "U")[0].toUpperCase();
  const unreadCount  = inboxNotifications
    ? localNotifs.filter((n) => !n.read).length
    : unreadNotifications;

  /* ── mark one read ─────────────────────────────────────── */
  const markRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setLocalNotifs(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch { /* silent */ }
  };

  /* ── mark all read ─────────────────────────────────────── */
  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  /* ── nav helpers ───────────────────────────────────────── */
  const isTabActive = (itemTab: string) =>
    pathname === "/dashboard" && tab === itemTab;

  const navItems = [
    { label: "Home",           icon: HomeIcon,  href: "/dashboard?tab=home",           active: isTabActive("home") },
    { label: "Projects",       icon: FolderOpen,href: "/dashboard?tab=projects",       active: isTabActive("projects") },
    { label: "Discover",       icon: Search,    href: "/projects",                     active: pathname.startsWith("/projects") && !pathname.endsWith("/create") },
    { label: "Collaborations", icon: Users,     href: "/dashboard?tab=collaborations", active: isTabActive("collaborations") },
    { label: "Hackathons",     icon: Trophy,    href: "/dashboard?tab=hackathons",     active: isTabActive("hackathons") },
    { label: "Bookmarks",      icon: Bookmark,  href: "/dashboard?tab=bookmarks",      active: isTabActive("bookmarks") },
  ];

  const spaceItems = [
    { label: "My Projects",  icon: FolderOpen, href: "/dashboard?tab=projects",     active: isTabActive("projects") },
    { label: "Applications", icon: Send,       href: "/dashboard?tab=applications", active: isTabActive("applications") },
    { label: "Invitations",  icon: Mail,       href: "/dashboard?tab=invitations",  active: isTabActive("invitations") },
  ];

  /* ── inbox dropdown ────────────────────────────────────── */
  const renderInboxDropdown = () => (
    <div
      className="absolute right-0 top-[calc(100%+8px)] w-80 bg-card border border-border rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Inbox size={14} strokeWidth={1.75} className="text-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Inbox</span>
          {unreadCount > 0 && (
            <span className="h-4 min-w-[16px] px-1 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CheckCheck size={12} strokeWidth={1.75} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
        {localNotifs.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Inbox size={22} strokeWidth={1.5} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          localNotifs.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                n.read
                  ? "opacity-50"
                  : "cursor-pointer hover:bg-secondary/50"
              }`}
              onClick={() => !n.read && markRead(n.id)}
            >
              {/* Unread dot */}
              <span
                className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 transition-all ${
                  n.read ? "bg-transparent" : "bg-foreground"
                }`}
              />

              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric",
                  })}
                  {!n.read && (
                    <span className="ml-2 text-[9px] font-semibold uppercase tracking-wide text-foreground/60">New</span>
                  )}
                </p>
              </div>

              {/* Mark read icon */}
              {!n.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  title="Mark as read"
                  aria-label="Mark as read"
                >
                  <Check size={11} strokeWidth={2} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {localNotifs.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border">
          <button
            onClick={() => { setInboxOpen(false); router.push("/dashboard?tab=notifications"); }}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full text-center"
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="h-14 border-b border-border px-5 flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[16px] font-bold tracking-tight text-foreground">Forge</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  item.active
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon size={16} strokeWidth={item.active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Spaces */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Spaces
            </p>
            {spaceItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  item.active
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon size={16} strokeWidth={item.active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin — only visible to ADMIN role */}
          {(user as any)?.role === "ADMIN" && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Admin
              </p>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-destructive/10 text-destructive font-semibold"
                    : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                }`}
              >
                <ShieldAlert size={16} strokeWidth={pathname === "/admin" ? 2.25 : 1.75} />
                Console
              </Link>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border relative" ref={profileRef}>
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {user?.image
                  ? <Image src={user.image} alt={user.name || "Avatar"} width={32} height={32} className="object-cover h-full w-full" unoptimized />
                  : <span className="text-[12px] font-bold text-foreground">{initials}</span>
                }
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[12px] font-semibold text-foreground leading-snug truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-none truncate mt-0.5">{user?.email || ""}</p>
              </div>
            </div>
            <MoreVertical size={14} className="text-muted-foreground shrink-0" />
          </div>

          {profileOpen && (
            <div className="absolute left-4 bottom-16 right-4 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50 animate-fade-in">
              <Link
                href="/dashboard?tab=profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Settings size={14} />
                Profile Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">

        {/* Desktop header */}
        <header className="hidden md:flex h-14 border-b border-border items-center justify-between px-6 bg-card sticky top-0 z-40">

          {/* Search bar — fixed padding so icon never overlaps text */}
          <div className="relative w-72 max-w-xs">
            <Search
              size={13}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search projects, skills…"
              onClick={() => router.push("/projects")}
              readOnly
              className="w-full pl-[2.125rem] pr-14 py-1.5 bg-secondary/50 border border-border rounded-lg text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground/50 transition-colors cursor-pointer"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="text-[10px] font-mono text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded shadow-sm">
                ⌘K
              </kbd>
            </span>
          </div>

          {/* Right — inbox button */}
          <div className="relative" ref={inboxRef}>
            <button
              onClick={() => setInboxOpen(!inboxOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer ${
                inboxOpen
                  ? "bg-secondary border-border text-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              aria-label="Open inbox"
              aria-expanded={inboxOpen}
            >
              <Inbox size={14} strokeWidth={1.75} />
              Inbox
              {unreadCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {inboxOpen && renderInboxDropdown()}
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden h-14 border-b border-border items-center justify-between px-4 bg-card sticky top-0 z-40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-[6px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">Forge</span>
          </Link>

          <div className="flex items-center gap-2" ref={inboxRef}>
            {/* Mobile inbox button */}
            <button
              onClick={() => setInboxOpen(!inboxOpen)}
              className="relative p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              aria-label="Open inbox"
            >
              <Inbox size={18} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>

            <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
              {user?.image
                ? <Image src={user.image} alt={user.name || "Avatar"} width={28} height={28} className="object-cover h-full w-full" unoptimized />
                : <span className="text-[11px] font-bold text-foreground">{initials}</span>
              }
            </div>

            {/* Mobile inbox dropdown — anchors to the right */}
            {inboxOpen && (
              <div className="absolute right-4 top-14 w-[calc(100vw-2rem)] max-w-sm bg-card border border-border rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                {renderInboxDropdown()}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/95 backdrop-blur-md flex items-center justify-around z-50 md:hidden pb-safe">
        <Link
          href="/dashboard?tab=home"
          className={`flex flex-col items-center justify-center gap-1 w-12 ${
            isTabActive("home") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <HomeIcon size={18} strokeWidth={isTabActive("home") ? 2.25 : 1.75} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/projects"
          className={`flex flex-col items-center justify-center gap-1 w-12 ${
            pathname.startsWith("/projects") && !pathname.endsWith("/create") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Search size={18} strokeWidth={pathname.startsWith("/projects") && !pathname.endsWith("/create") ? 2.25 : 1.75} />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        <Link
          href="/dashboard?tab=collaborations"
          className={`flex flex-col items-center justify-center gap-1 w-12 ${
            isTabActive("collaborations") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Users size={18} strokeWidth={isTabActive("collaborations") ? 2.25 : 1.75} />
          <span className="text-[10px] font-medium">Collabs</span>
        </Link>

        <Link
          href="/dashboard?tab=profile"
          className={`flex flex-col items-center justify-center gap-1 w-12 ${
            isTabActive("profile") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <div className="h-[22px] w-[22px] rounded-full border-[1.5px] border-current flex items-center justify-center overflow-hidden">
            {user?.image
              ? <Image src={user.image} alt={user.name || "Avatar"} width={22} height={22} className="object-cover h-full w-full" unoptimized />
              : <span className="text-[9px] font-bold">{initials}</span>
            }
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </div>
  );
}
