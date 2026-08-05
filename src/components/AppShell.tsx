"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import ColabroLogo from "./ColabroLogo";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import {
  Home as HomeIcon,
  LayoutGrid,
  Calendar,
  FolderOpen,
  Search,
  Users,
  Trophy,
  Send,
  Mail,
  Inbox,
  MoreHorizontal,
  LogOut,
  Settings,
  Check,
  CheckCheck,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import { getNotificationLink } from "@/lib/notifications";

interface NotificationItem {
  id: number;
  message: string;
  type?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string | Date;
}

interface AppShellProps {
  children: React.ReactNode;
  user: any;
  unreadNotifications?: number;
  inboxNotifications?: NotificationItem[];
}

const EMPTY_NOTIFS: NotificationItem[] = [];

const QUICK_NAV = [
  { label: "Discover Projects", href: "/projects", icon: Search },
  { label: "Create New Project", href: "/projects/create", icon: FolderOpen },
  { label: "Events & Competitions", href: "/dashboard?tab=events", icon: Trophy },
  { label: "My Applications", href: "/dashboard?tab=applications", icon: Send },
  { label: "Profile Settings", href: "/dashboard?tab=profile", icon: Settings },
];

export default function AppShell({
  children,
  user,
  unreadNotifications = 0,
  inboxNotifications,
}: AppShellProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const stableNotifs = inboxNotifications ?? EMPTY_NOTIFS;

  const [profileOpen, setProfileOpen] = useState(false);
  const [inboxOpen,   setInboxOpen]   = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [searchModalOpen,   setSearchModalOpen]   = useState(false);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [localNotifs, setLocalNotifs] = useState<NotificationItem[]>(stableNotifs);

  const [clientName, setClientName] = useState(user?.name || "");
  const [clientImage, setClientImage] = useState(user?.image || "");

  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setClientName(user?.name || "");
    setClientImage(user?.image || "");
  }

  useEffect(() => {
    async function syncProfile() {
      try {
        const res = await fetch(`/api/user/profile?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.name) setClientName(data.name);
          if (data.profileImage) setClientImage(data.profileImage);
        }
      } catch { /* silent */ }
    }
    syncProfile();
  }, []);

  const profileRef   = useRef<HTMLDivElement>(null);
  const inboxDesktop = useRef<HTMLDivElement>(null);
  const inboxMobile  = useRef<HTMLDivElement>(null);

  const tab = searchParams.get("tab") || "home";

  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      const insideDesktop = inboxDesktop.current?.contains(target) ?? false;
      const insideMobile  = inboxMobile.current?.contains(target)  ?? false;
      if (!insideDesktop && !insideMobile) setInboxOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initials = ((clientName || "U").trim()[0] || "U").toUpperCase();
  const unreadCount = inboxNotifications
    ? localNotifs.filter((n) => !n.read).length
    : unreadNotifications;

  const markRead = async (id: number) => {
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await fetch(`/api/notifications/${id}`, { method: "PATCH" }); } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try { await fetch("/api/notifications", { method: "PATCH" }); } catch { /* silent */ }
  };

  const deleteNotif = async (id: number) => {
    setLocalNotifs(prev => prev.filter(n => n.id !== id));
    try { await fetch(`/api/notifications/${id}`, { method: "DELETE" }); } catch { /* silent */ }
  };

  const clearAllNotifs = async () => {
    setLocalNotifs([]);
    try { await fetch("/api/notifications", { method: "DELETE" }); } catch { /* silent */ }
  };

  const isTabActive = (itemTab: string) =>
    pathname === "/dashboard" && tab === itemTab;

  const navItems = [
    { label: "Dashboard",      icon: LayoutGrid, href: "/dashboard?tab=home",           active: isTabActive("home") || (pathname === "/dashboard" && !tab) },
    { label: "Collaborators",  icon: Users,      href: "/dashboard?tab=collaborations", active: isTabActive("collaborations") },
    { label: "Events",         icon: Trophy,     href: "/dashboard?tab=events",         active: isTabActive("events") || isTabActive("hackathons") },
  ];

  const spaceItems = [
    { label: "My Projects",  icon: FolderOpen, href: "/dashboard?tab=projects",     active: isTabActive("projects") },
    { label: "Applications", icon: Send,       href: "/dashboard?tab=applications", active: isTabActive("applications") },
    { label: "Invitations",  icon: Mail,       href: "/dashboard?tab=invitations",  active: isTabActive("invitations") },
  ];

  /* ── Inbox dropdown ──────────────────────────────────── */
  const inboxDropdownContent = (
    <>
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
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <CheckCheck size={12} strokeWidth={1.75} />
              Read all
            </button>
          )}
          {localNotifs.length > 0 && (
            <button
              onClick={clearAllNotifs}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Clear all inbox messages"
            >
              <Trash2 size={12} strokeWidth={1.75} />
              Clear all
            </button>
          )}
        </div>
      </div>

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
              className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-secondary/50 group"
              onClick={() => {
                if (!n.read) markRead(n.id);
                setInboxOpen(false);
                router.push(getNotificationLink(n));
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-transparent" : "bg-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                  {!n.read && (
                    <span className="ml-2 text-[9px] font-semibold uppercase tracking-wide text-foreground/60">New</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <Check size={11} strokeWidth={2} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Clear message"
                  aria-label="Clear message"
                >
                  <Trash2 size={11} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
    </>
  );

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Ambient accent glow — fixed, decorative, non-interactive ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-[36rem] w-[36rem] rounded-full opacity-60 dark:opacity-40"
          style={{
            background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 14%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 dark:opacity-30"
          style={{
            background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 10%, transparent) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0 h-screen sticky top-0 relative z-10">

        {/* Logo row */}
        <div className="h-14 border-b border-border px-4 flex items-center gap-2 bg-gradient-to-b from-primary/5 to-transparent">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <ColabroLogo size={28} />
            <span className="text-[16px] font-logo text-foreground truncate">
              Colabro
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-5 overflow-y-auto">

          <div className="space-y-px">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ease-out-quart ${
                  item.active
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:shadow-xs"
                }`}
              >
                {/* Active indicator bar */}
                {item.active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" aria-hidden="true" />
                )}
                <item.icon size={15} strokeWidth={2} className={`shrink-0 transition-all duration-200 ${item.active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Spaces */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/85 mb-1.5">
              My Space
            </p>
            <div className="space-y-px">
              {spaceItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    item.active
                      ? "bg-primary/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  {item.active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" aria-hidden="true" />
                  )}
                  <item.icon size={15} strokeWidth={item.active ? 2.25 : 1.75} className={`shrink-0 ${item.active ? "text-primary" : ""}`} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Admin */}
          {user?.role === "ADMIN" && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/85 mb-1.5">
                Admin
              </p>
              <Link
                href="/admin"
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-destructive/10 text-destructive font-semibold"
                    : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                }`}
              >
                <ShieldAlert size={15} strokeWidth={pathname === "/admin" ? 2.25 : 1.75} />
                Console
              </Link>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-secondary/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative shrink-0">
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                  {clientImage
                    ? <Image src={clientImage} alt={clientName || "Avatar"} width={28} height={28} className="object-cover h-full w-full" unoptimized />
                    : <span className="text-[11px] font-bold text-foreground">{initials}</span>
                  }
                </div>
                {user && (
                  <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[12px] font-semibold text-foreground leading-snug truncate">{clientName || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-none truncate mt-0.5">{user?.email || ""}</p>
              </div>
            </div>
            <MoreHorizontal size={14} className="text-muted-foreground shrink-0" />
          </button>

          {profileOpen && (
            <div className="absolute left-3 bottom-[calc(100%-8px)] right-3 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50 animate-fade-in">
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <ShieldAlert size={13} />
                  Admin Portal
                </Link>
              )}
              <Link
                href="/dashboard?tab=profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Settings size={13} />
                Profile Settings
              </Link>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Desktop header */}
        <header
          className="hidden md:flex h-14 border-b border-border items-center justify-between px-6 bg-card backdrop-blur-sm sticky top-0 z-50"
          style={{ boxShadow: "0 1px 0 0 color-mix(in oklab, var(--accent) 6%, transparent), 0 1px 3px rgba(16,24,40,0.03)" }}
        >
          <div />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={inboxDesktop}>
              <button
                onClick={() => setInboxOpen(prev => !prev)}
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

              {inboxOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-80 bg-card border border-border rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden dropdown"
                >
                  {inboxDropdownContent}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden h-14 border-b border-border items-center justify-between px-4 bg-card sticky top-0 z-50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ColabroLogo size={28} />
            <span className="text-[16px] font-logo text-foreground">
              Colabro
            </span>
          </Link>

          <div className="flex items-center gap-1 relative" ref={inboxMobile}>
            <ThemeToggle />

            {/* Inbox trigger — 44×44 touch target */}
            <button
              onClick={() => setInboxOpen(prev => !prev)}
              className="relative flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
              aria-label="Open inbox"
              aria-expanded={inboxOpen}
            >
              <Inbox size={18} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>

            {/* Inbox dropdown — fixed position clears the sticky header */}
            {inboxOpen && (
              <div
                className="fixed right-4 w-[calc(100vw-2rem)] max-w-sm bg-card border border-border rounded-xl shadow-xl z-[60] animate-fade-in overflow-hidden dropdown top-14"
              >
                {inboxDropdownContent}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 mobile-scroll-pad">
          {children}
        </div>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="flex items-center justify-between px-2 h-16 max-w-md mx-auto">
        {[
          { href: "/dashboard?tab=events", icon: Calendar, label: "Events", active: isTabActive("events") || isTabActive("hackathons") },
          { href: "/dashboard?tab=collaborations", icon: Users, label: "Collaborators", active: isTabActive("collaborations") },
          { href: "/dashboard?tab=home", icon: HomeIcon, label: "Dashboard", active: isTabActive("home") || (pathname === "/dashboard" && !tab) },
          { href: "/projects", icon: Search, label: "Discover", active: pathname.startsWith("/projects") && !pathname.endsWith("/create") },
        ].map(({ href, icon: Icon, label, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-1 min-h-[44px] rounded-xl transition-colors ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.25 : 1.75} className="shrink-0" />
            <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setMobileProfileOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-1 min-h-[44px] rounded-xl transition-colors ${
            isTabActive("profile") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <div className="relative shrink-0">
            <div className="h-[20px] w-[20px] rounded-full border-[1.5px] border-current flex items-center justify-center overflow-hidden">
              {clientImage
                ? <Image src={clientImage} alt={clientName || "Avatar"} width={20} height={20} className="object-cover h-full w-full" unoptimized />
                : <span className="text-[8.5px] font-bold leading-none">{initials}</span>
              }
            </div>
            {user && (
              <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-success border border-card" />
            )}
          </div>
          <span className="text-[10px] font-medium truncate max-w-full">Profile</span>
        </button>
        </div>
      </nav>

      {/* ── Mobile profile sheet ─────────────────────────── */}
      {mobileProfileOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileProfileOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Profile settings"
            className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-2xl shadow-2xl md:hidden animate-slide-up"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                  <div className="h-11 w-11 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                    {clientImage
                      ? <Image src={clientImage} alt={clientName || "Avatar"} width={44} height={44} className="object-cover h-full w-full" unoptimized />
                      : <span className="text-[15px] font-bold text-foreground">{initials}</span>
                    }
                  </div>
                  {user && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[14px] font-semibold text-foreground truncate">{clientName || "User"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileProfileOpen(false)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
                aria-label="Close profile menu"
                title="Close"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="px-3 py-2 space-y-px">
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[13px] font-bold text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <ShieldAlert size={16} />
                  Admin Portal
                </Link>
              )}

              {/* My Space nav — visible only on mobile */}
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                My Space
              </p>
              {[
                ...spaceItems,
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileProfileOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[13px] font-medium transition-colors ${
                    item.active
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon size={16} strokeWidth={item.active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              ))}

              <div className="h-px bg-border mx-1 my-1" />

              <Link
                href="/dashboard?tab=profile"
                onClick={() => setMobileProfileOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Settings size={16} strokeWidth={1.75} />
                Profile Settings
              </Link>
              <ThemeToggleRow />
            </div>

            <div className="px-3 pb-2">
              <button
                onClick={() => { setMobileProfileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut size={16} strokeWidth={1.75} />
                Sign out
              </button>
            </div>

            <div className="h-6" />
          </div>
        </>
      )}

      {/* ── ⌘K Command Palette Modal ───────────────────────── */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search projects and command palette"
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoCapitalize="off"
                autoCorrect="off"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    setSearchModalOpen(false);
                    router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search projects, skills, events…"
                className="w-full bg-transparent text-[14px] min-h-[36px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded shrink-0">ESC</kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-1"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Search size={15} className="shrink-0" />
                    Search projects for &quot;{searchQuery.trim()}&quot;
                  </span>
                  <span className="text-[11px] shrink-0 ml-2">Press Enter ↵</span>
                </button>
              )}

              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/85">
                {searchQuery.trim() ? "Matching Actions" : "Quick Navigation"}
              </p>

              {QUICK_NAV
                .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                .map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { setSearchModalOpen(false); setSearchQuery(""); router.push(item.href); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-secondary transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon size={15} className="text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Jump →</span>
                  </button>
                ))}

              {searchQuery.trim() && QUICK_NAV
                .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())).length === 0 && (
                  <div className="px-3 py-6 text-center text-muted-foreground text-[12px]">
                    No matching quick actions. Press Enter to search all projects.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggleRow() {
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
      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[13px] font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
    >
      <span className="flex items-center gap-3">
        {activeTheme === "dark"
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
        {activeTheme === "dark" ? "Light mode" : "Dark mode"}
      </span>
      <span className="text-[11px] text-muted-foreground">{activeTheme === "dark" ? "On" : "Off"}</span>
    </button>
  );
}
