"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Folder, Send, Users, Trophy, Plus, Search, X, Clock,
  Calendar, MapPin, Globe, Sparkles, LucideIcon, ArrowUpRight,
  CheckCircle2, AlertCircle, Compass, Zap, Filter, ChevronRight, UserCheck, ShieldCheck, Mail,
  Award, TrendingUp, Crown, Flame, Star
} from "lucide-react";
import { getNotificationLink } from "@/lib/notifications";
import { parseEventEndDate } from "@/lib/projects";
import { getDeveloperReputation } from "@/lib/reputation/utils";

interface HomeTabProps {
  projects: any[];
  applications: any[];
  notifications: any[];
  currentUser: any;
  events: any[];
  hackathons: any[];
  recommendedProjects: any[];
  recentNotifications: any[];
  receivedInvitations?: any[];
  collaborations?: any[];
  leaderboardUsers?: any[];
  getProjectIcon: (title: string) => { icon: LucideIcon; bg: string; text: string };
  nowMs: number;
  departments: string[];
}

export default function HomeTab({
  projects,
  applications,
  notifications,
  currentUser,
  events,
  hackathons,
  recommendedProjects,
  recentNotifications,
  receivedInvitations = [],
  collaborations = [],
  leaderboardUsers = [],
  getProjectIcon,
  nowMs,
  departments,
}: HomeTabProps) {
  const [dashSearch, setDashSearch] = useState("");
  const [dashCategory, setDashCategory] = useState("All");
  const [dashDept, setDashDept] = useState("");
  const [dashStatus, setDashStatus] = useState("ALL");
  const [dashPage, setDashPage] = useState(1);
  const [mobileHomeSegment, setMobileHomeSegment] = useState<"projects" | "insights">("projects");

  const eventsList = (events && events.length > 0) ? events : hackathons;

  const activeEventsList = eventsList.filter((h: any) => {
    const endMs = parseEventEndDate(h);
    return endMs === null || endMs >= nowMs;
  });
  const topEvents = (activeEventsList.length > 0 ? activeEventsList : eventsList).slice(0, 4);

  const userProjects = projects.filter((p: any) => Number(p.ownerId) === Number(currentUser?.id));
  const userApplications = useMemo(() => applications || [], [applications]);

  const activityItems = useMemo(() => {
    const items: {
      id: string; message: string; link: string; createdAt: Date; dot: string; typeLabel: string;
    }[] = [];

    for (const p of userProjects) {
      items.push({
        id: `proj-${p.id}`,
        message: `Created project "${p.title}"`,
        link: `/projects/${p.id}`,
        createdAt: new Date(p.createdAt),
        dot: "bg-purple-500",
        typeLabel: "Project",
      });
    }

    for (const a of userApplications) {
      const msg = a.status === "ACCEPTED"
        ? `Application accepted for "${a.project?.title || "Project"}"`
        : a.status === "REJECTED"
        ? `Application declined for "${a.project?.title || "Project"}"`
        : `Applied to "${a.project?.title || "Project"}"`;
      items.push({
        id: `app-${a.id}`,
        message: msg,
        link: `/projects/${a.project?.id || a.projectId}`,
        createdAt: new Date(a.createdAt),
        dot: a.status === "ACCEPTED" ? "bg-emerald-500" : a.status === "REJECTED" ? "bg-rose-500" : "bg-amber-500",
        typeLabel: "Application",
      });
    }

    for (const n of notifications || []) {
      items.push({
        id: `notif-${n.id}`,
        message: n.message,
        link: getNotificationLink(n),
        createdAt: new Date(n.createdAt),
        dot: n.read ? "bg-muted-foreground/40" : "bg-accent",
        typeLabel: "Alert",
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, 8);
  }, [userProjects, userApplications, notifications]);

  // Derive top campus collaborators / leaderboard based on Developer Reputation Score.
  // Prefer the dedicated leaderboardUsers prop (campus-wide, pre-sorted server-side).
  // Fall back to paginated collaborations only when leaderboardUsers is empty.
  const topCollaborators = useMemo(() => {
    // Use the dedicated campus-wide leaderboard if available
    const pool = leaderboardUsers.length > 0 ? [...leaderboardUsers] : [
      ...((collaborations && collaborations.length > 0)
        ? collaborations
        : projects.map((p: any) => p.owner).filter(Boolean))
    ];

    // Always include the current user so they can see themselves on the board
    if (currentUser) {
      const curEmail = currentUser.email?.toLowerCase().trim() || '';
      const curIdStr = currentUser.id ? String(currentUser.id) : '';
      const idx = pool.findIndex((u: any) =>
        (u.email && curEmail && u.email.toLowerCase().trim() === curEmail) ||
        (u.id && curIdStr && String(u.id) === curIdStr)
      );
      if (idx !== -1) {
        pool[idx] = { ...pool[idx], ...currentUser };
      } else {
        pool.unshift(currentUser);
      }
    }

    const uniqueMap = new Map<string, any>();
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();
    let fallbackIdx = 0;

    for (const c of pool) {
      if (!c) continue;
      const idKey = c.id ? String(c.id) : '';
      const emailKey = c.email ? c.email.toLowerCase().trim() : '';

      if (idKey && seenIds.has(idKey)) continue;
      if (emailKey && seenEmails.has(emailKey)) continue;

      if (idKey) seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);

      const rep = getDeveloperReputation(c);

      // Use a stable key — never Math.random()
      const mapKey = idKey || emailKey || `fallback-${fallbackIdx++}`;
      uniqueMap.set(mapKey, {
        id: c.id,
        name: c.name || "Student",
        department: c.department || "Computer Science",
        reputationScore: rep.score,
        stars: rep.stars,
        tier: rep.tier,
        githubConnected: rep.githubConnected,
      });
    }

    // When using the dedicated leaderboard pool, the array is already sorted
    // server-side; re-sort here for safety and to handle the current-user merge.
    return Array.from(uniqueMap.values())
      .sort((a, b) => {
        if (a.githubConnected !== b.githubConnected) {
          return a.githubConnected ? -1 : 1;
        }
        return (b.reputationScore ?? 0) - (a.reputationScore ?? 0);
      })
      .slice(0, 4);
  }, [leaderboardUsers, collaborations, projects, currentUser]);

  // Derive trending tech stacks on campus
  const trendingSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const s of p.skills || []) {
        const name = typeof s === "string" ? s : s.name;
        if (name) {
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [projects]);

  const getSkillMatchScore = (userSkillsList: any[], projSkillsList: any[]) => {
    if (!projSkillsList || projSkillsList.length === 0) return { matchingCount: 0, totalRequired: 0, matchLabel: "" };
    const userSkillNames = new Set((userSkillsList || []).map((s: any) => (s.name || s).toLowerCase()));
    let matchingCount = 0;
    projSkillsList.forEach((s: any) => {
      if (userSkillNames.has((s.name || s).toLowerCase())) matchingCount++;
    });
    const totalRequired = projSkillsList.length;
    return {
      matchingCount,
      totalRequired,
      matchLabel: `Matches ${matchingCount}/${totalRequired} skills`,
    };
  };

  const topRecommendedSpotlight = useMemo(() => {
    if (!recommendedProjects || recommendedProjects.length === 0) return null;
    return recommendedProjects[0];
  }, [recommendedProjects]);

  const filteredProjects = projects.filter((p: any) => {
    if (dashSearch) {
      const q = dashSearch.trim().toLowerCase();
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      const matchCategory = (p.category || "").toLowerCase().includes(q);
      const matchType = (p.projectType || "").toLowerCase().includes(q);
      const matchSkill = p.skills?.some((s: any) => (s.name || "").toLowerCase().includes(q));
      const matchOwner = (p.owner?.name || "").toLowerCase().includes(q) || (p.owner?.email || "").toLowerCase().includes(q);
      const matchDept = (p.owner?.department || "").toLowerCase().includes(q);
      const matchApplicant = p.applications?.some((a: any) => (a.user?.name || "").toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCategory && !matchType && !matchSkill && !matchOwner && !matchDept && !matchApplicant) return false;
    }
    if (dashCategory !== "All") {
      const cat = dashCategory.toLowerCase();
      const matchCat = (p.category || "").toLowerCase().includes(cat);
      const matchType = (p.projectType || "").toLowerCase().includes(cat);
      const matchSkill = p.skills?.some((s: any) => (s.name || "").toLowerCase().includes(cat));
      if (!matchCat && !matchType && !matchSkill) return false;
    }
    if (dashDept) {
      if ((p.owner?.department || "").toLowerCase() !== dashDept.toLowerCase()) return false;
    }
    if (dashStatus !== "ALL") {
      if (p.status !== dashStatus) return false;
    }
    return true;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const currentProjects = filteredProjects.slice((dashPage - 1) * itemsPerPage, dashPage * itemsPerPage);

  const pendingApplicationsCount = userApplications.filter((a: any) => a.status === "PENDING").length;
  const unreadNotifsCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── 1. WORKSPACE HEADER & COMMAND BAR ───────────────────────── */}
      <div className="card p-6 sm:p-7 relative overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
                <ShieldCheck size={12} /> Campus Collaborator
              </span>
              {currentUser?.department && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  {currentUser.department}
                </span>
              )}
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-bold text-foreground tracking-tight leading-snug">
              Welcome back, <span className="text-foreground">{currentUser?.name || "Student"}</span>
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xl">
              Your central campus command hub. Discover high-impact student projects, manage recruitment, and showcase your skills.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              href="/dashboard?tab=collaborations"
              className="btn-secondary py-2.5 px-4 text-[12.5px] font-semibold inline-flex items-center gap-2 rounded-xl"
            >
              <Compass size={15} /> Find Teammates
            </Link>
            <Link
              href="/projects/create"
              className="btn-primary py-2.5 px-4 text-[12.5px] font-bold inline-flex items-center gap-2 rounded-xl shadow-xs"
            >
              <Plus size={16} strokeWidth={2.5} /> Post Project
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. PERSONAL PULSE METRICS STRIP ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          href="/dashboard?tab=projects"
          className="card p-4.5 flex items-center justify-between gap-3 hover:border-accent/40 hover:bg-muted/50 transition-all group"
        >
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">My Projects</p>
            <p className="text-[26px] font-extrabold text-foreground leading-none tracking-tight">{userProjects.length}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Folder size={20} />
          </div>
        </Link>

        <Link
          href="/dashboard?tab=applications"
          className="card p-4.5 flex items-center justify-between gap-3 hover:border-accent/40 hover:bg-muted/50 transition-all group"
        >
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Applications</p>
            <p className="text-[26px] font-extrabold text-foreground leading-none tracking-tight">{userApplications.length}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Send size={20} />
          </div>
        </Link>

        <Link
          href="/dashboard?tab=applications"
          className="card p-4.5 flex items-center justify-between gap-3 hover:border-accent/40 hover:bg-muted/50 transition-all group"
        >
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Reviews</p>
            <p className="text-[26px] font-extrabold text-amber-500 dark:text-amber-400 leading-none tracking-tight">{pendingApplicationsCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Clock size={20} />
          </div>
        </Link>

        <Link
          href="/dashboard?tab=notifications"
          className="card p-4.5 flex items-center justify-between gap-3 hover:border-accent/40 hover:bg-muted/50 transition-all group"
        >
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unread Alerts</p>
            <p className="text-[26px] font-extrabold text-accent leading-none tracking-tight">{unreadNotifsCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users size={20} />
          </div>
        </Link>
      </div>

      {/* Mobile Segment Tabs */}
      <style>{`
        .home-segment-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 3.5px;
        }
        .home-tab-btn {
          padding: 10px 16px;
          font-size: 12.5px;
          font-weight: 700;
          text-align: center;
          border-radius: 9px;
          border: none;
          background: none;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all 180ms ease;
        }
        .home-tab-btn.active {
          background: var(--bg-surface);
          color: var(--text-primary);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }
        @media (min-width: 1024px) {
          .home-segment-tabs {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="lg:hidden home-segment-tabs">
        <button
          onClick={() => setMobileHomeSegment("projects")}
          className={`home-tab-btn ${mobileHomeSegment === "projects" ? "active" : ""}`}
        >
          Explore Projects
        </button>
        <button
          onClick={() => setMobileHomeSegment("insights")}
          className={`home-tab-btn ${mobileHomeSegment === "insights" ? "active" : ""}`}
        >
          Leaderboard &amp; Insights
        </button>
      </div>

      {/* ── 3. ASYMMETRIC 2-COLUMN WORKSPACE MATRIX ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT / MAIN STAGE (8 COLS) ─────────────────────────────── */}
        <div className={`lg:col-span-8 space-y-7 min-w-0 ${mobileHomeSegment === "projects" ? "block" : "hidden lg:block"}`}>

          {/* SPOTLIGHT MATCH BLOCK (Hero Recommendation) */}
          {topRecommendedSpotlight && (
            <div className="card p-6 border-accent/30 bg-gradient-to-r from-accent/5 via-card to-card space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-7 px-3 rounded-full bg-accent text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs">
                    <Zap size={13} /> Recommended Match
                  </span>
                  {(() => {
                    const match = getSkillMatchScore(currentUser?.skills, topRecommendedSpotlight.skills);
                    if (!match.matchingCount) return null;
                    return (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                        {match.matchLabel}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Posted by <strong className="text-foreground">{topRecommendedSpotlight.owner?.name}</strong> ({topRecommendedSpotlight.owner?.department || "Campus"})
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[18px] font-extrabold text-foreground leading-snug hover:text-accent transition-colors">
                  <Link href={`/projects/${topRecommendedSpotlight.id}`}>{topRecommendedSpotlight.title}</Link>
                </h3>
                <p className="text-[12.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {topRecommendedSpotlight.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {topRecommendedSpotlight.skills?.map((skill: any) => (
                    <span key={skill.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">
                      {skill.name}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/projects/${topRecommendedSpotlight.id}`}
                  className="btn-primary py-2 px-4 text-[11.5px] font-bold shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg"
                >
                  View &amp; Apply <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* DYNAMIC SEARCH & FILTER CONTROL BAR */}
          <div className="card p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-accent" />
                <h2 className="text-[14px] font-bold text-foreground tracking-tight">Explore Campus Projects</h2>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Showing {filteredProjects.length} projects
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={dashSearch}
                onChange={(e) => { setDashSearch(e.target.value); setDashPage(1); }}
                placeholder="Search by project name, tech stack (React, Python), department..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-secondary/50 border border-border text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {dashSearch && (
                <button
                  type="button"
                  onClick={() => setDashSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {["All", "AI", "Web", "IoT", "Robotics", "Research", "Hackathon", "Productivity"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setDashCategory(cat); setDashPage(1); }}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      dashCategory === cat
                        ? "bg-accent text-white font-bold shadow-xs"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={dashDept}
                  onChange={(e) => { setDashDept(e.target.value); setDashPage(1); }}
                  className="forge-select text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={dashStatus}
                  onChange={(e) => { setDashStatus(e.target.value); setDashPage(1); }}
                  className="forge-select text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="FULL">Full</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* PROJECT FEED GRID */}
          {currentProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentProjects.map((project: any) => {
                const iconInfo = getProjectIcon(project.title);
                const Icon = iconInfo.icon;
                const match = getSkillMatchScore(currentUser?.skills, project.skills);

                const pTeamSize = project.teamSize ?? null;
                const pSlotsFilled = project.slotsFilled ?? 0;
                const pIsFull = pTeamSize !== null && pTeamSize > 0 && pSlotsFilled >= pTeamSize;

                return (
                  <article
                    key={project.id}
                    className="card p-5 space-y-3.5 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`h-10 w-10 rounded-xl ${iconInfo.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon size={19} className={iconInfo.text} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {project.status === "OPEN" && <span className="badge badge-green text-[9px] font-bold">OPEN</span>}
                          {project.status === "FULL" && <span className="badge badge-yellow text-[9px] font-bold">FULL</span>}
                          {project.status === "CLOSED" && <span className="badge badge-red text-[9px] font-bold">CLOSED</span>}
                          {pTeamSize !== null && pTeamSize > 0 ? (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                              pIsFull
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-secondary/80 text-foreground border-border"
                            }`}>
                              <Users size={10} className={pIsFull ? "text-amber-500" : "text-accent"} />
                              {pSlotsFilled}/{pTeamSize} slots
                            </span>
                          ) : pSlotsFilled > 0 ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-secondary/80 text-foreground border border-border">
                              <Users size={10} className="text-accent" />
                              {pSlotsFilled} filled
                            </span>
                          ) : null}
                          {match.matchingCount > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                              {match.matchingCount} skill match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-[14px] font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-1">
                          <Link href={`/projects/${project.id}`}>{project.title}</Link>
                        </h3>
                        <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.skills?.slice(0, 3).map((skill: any) => (
                          <span key={skill.id} className="text-[9px] font-medium px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[9px] shrink-0 text-foreground">
                          {(project.owner?.name?.[0] || "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-semibold text-foreground truncate">{project.owner?.name || "Student"}</p>
                          <p className="text-[8.5px] text-muted-foreground truncate">{project.owner?.department || "Campus"}</p>
                        </div>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-[11px] font-bold text-accent hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="card p-10 text-center space-y-2 border-dashed">
              <p className="text-[13px] font-semibold text-foreground">No projects matched your criteria.</p>
              <p className="text-[11.5px] text-muted-foreground">Try adjusting your department or category filters.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDashPage(p => Math.max(1, p - 1))}
                disabled={dashPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setDashPage(pNum)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    dashPage === pNum
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pNum}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDashPage(p => Math.min(totalPages, p + 1))}
                disabled={dashPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
              >
                Next
              </button>
            </div>
          )}

          {/* CAMPUS EVENTS & HACKATHONS TRACK */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500 dark:text-amber-400" />
                <h2 className="text-[15px] font-bold text-foreground tracking-tight">Campus Events &amp; Competitions</h2>
              </div>
              <Link href="/dashboard?tab=events" className="text-[12px] font-semibold text-accent hover:underline flex items-center gap-1">
                View all events →
              </Link>
            </div>

            {topEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topEvents.slice(0, 2).map((h: any) => {
                  const locationStr = [h.location, h.city, h.state].filter(Boolean).join(", ") || h.location || "Online";
                  const mainPrize = h.prize ? (h.prize.includes("|") ? h.prize.split("|")[0].trim() : h.prize) : null;

                  return (
                    <div key={h.id} className="card p-5 space-y-3.5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9.5px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                            {h.organizerType || "HACKATHON"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                            Live
                          </span>
                        </div>
                        <h3 className="text-[14px] font-bold text-foreground leading-snug line-clamp-1">
                          {h.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          Organized by <strong className="text-foreground">{h.organizer || "Campus Partner"}</strong>
                        </p>
                      </div>

                      {mainPrize && (
                        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 truncate flex items-center gap-1.5">
                            <Trophy size={12} /> {mainPrize}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Calendar size={11} /> Dates:</span>
                          <span className="font-semibold text-foreground truncate">{h.startDate || h.date || "TBA"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><MapPin size={11} /> Venue:</span>
                          <span className="font-semibold text-foreground truncate">{locationStr}</span>
                        </div>
                      </div>

                      <a
                        href={h.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full btn-primary py-2 text-[11.5px] font-bold justify-center flex items-center gap-1 rounded-lg shadow-xs"
                      >
                        Register Now <ArrowUpRight size={13} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-6 text-center text-[12px] text-muted-foreground">No upcoming events listed at this moment.</div>
            )}
          </div>

        </div>{/* END LEFT STAGE */}

        {/* ── RIGHT CONTROL SIDEBAR (4 COLS) ─────────────────────────── */}
        <div className={`lg:col-span-4 space-y-6 min-w-0 ${mobileHomeSegment === "insights" ? "block" : "hidden lg:block"}`}>

          {/* INVITATIONS ACTION WIDGET */}
          {receivedInvitations && receivedInvitations.length > 0 && (
            <div className="card p-5 space-y-3.5 border-accent/40 bg-accent/5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-accent" />
                  <h3 className="text-[13.5px] font-bold text-foreground">Project Invitations</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white">
                  {receivedInvitations.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {receivedInvitations.slice(0, 2).map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-card border border-border space-y-2">
                    <p className="text-[11.5px] text-foreground font-medium leading-snug">
                      <strong className="font-bold">{inv.sender?.name}</strong> invited you to join <strong className="text-accent">{inv.project?.title}</strong>
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href="/dashboard?tab=invitations"
                        className="btn-primary text-[10.5px] py-1 px-3 font-bold rounded-lg"
                      >
                        Review Invitation
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. CAMPUS LEADERBOARD & TOP COLLABORATORS */}
          <div className="card p-5 space-y-3.5 border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Crown size={17} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <h3 className="text-[13.5px] font-bold text-foreground tracking-tight">Campus Leaderboard</h3>
              </div>
              <Link href="/dashboard?tab=collaborations" className="text-[11px] font-bold text-amber-500 hover:underline">
                View all →
              </Link>
            </div>

            {topCollaborators.length > 0 ? (
              <div className="space-y-2.5">
                {topCollaborators.map((c: any, index: number) => {
                  const rankColors = [
                    "bg-amber-500 text-white font-black",
                    "bg-slate-300 text-slate-900 font-bold dark:bg-slate-600 dark:text-white",
                    "bg-amber-700/80 text-white font-bold",
                    "bg-secondary text-muted-foreground font-bold",
                  ];
                  return (
                    <div
                      key={String(c.id)}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/70 border border-border/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-6 w-6 rounded-full text-[10px] flex items-center justify-center shrink-0 shadow-xs ${rankColors[index] || rankColors[3]}`}>
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/profile/${c.id}`} className="text-[11.5px] font-bold text-foreground truncate group-hover:text-amber-500 transition-colors block">
                            {c.name}
                          </Link>
                          <p className="text-[9px] text-muted-foreground truncate">{c.department}</p>
                        </div>
                      </div>
                      {c.githubConnected ? (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border shrink-0 ${
                          c.tier === "Elite" ? "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20" :
                          c.tier === "Excellent" ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20" :
                          "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20"
                        }`}>
                          ★ {c.stars.toFixed(1)} {c.reputationScore !== null && c.reputationScore !== undefined ? `(${c.reputationScore})` : ""}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border shrink-0">
                          Not Rated
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-3 text-center text-[11.5px] text-muted-foreground">No collaborators ranked yet.</p>
            )}
          </div>

          {/* 2. TRENDING TECH STACKS RADAR */}
          {trendingSkills.length > 0 && (
            <div className="card p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-rose-500 shrink-0" />
                  <h3 className="text-[13.5px] font-bold text-foreground tracking-tight">Trending Tech Stacks</h3>
                </div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Campus demand</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trendingSkills.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => { setDashSearch(s.name); setDashPage(1); }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-accent hover:text-white border border-border text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{s.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-background/80 font-bold opacity-80">
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MY WORKSPACE SUMMARY (Projects & Apps) */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Folder size={15} className="text-purple-500" /> My Active Work
              </h3>
              <Link href="/dashboard?tab=projects" className="text-[11px] font-bold text-accent hover:underline">
                Manage →
              </Link>
            </div>

            {/* User Created Projects */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Created Projects</p>
              {userProjects.length > 0 ? (
                userProjects.slice(0, 3).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/80 border border-border/50 transition-colors group"
                  >
                    <span className="text-[11.5px] font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                      {p.title}
                    </span>
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded shrink-0 uppercase ${
                      p.status === "OPEN" ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20" :
                      p.status === "FULL" ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-[11.5px] text-muted-foreground italic py-1">No projects created yet.</p>
              )}
            </div>

            {/* Active Applications */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">Sent Applications</p>
              {userApplications.length > 0 ? (
                userApplications.slice(0, 3).map((app: any) => (
                  <Link
                    key={app.id}
                    href={`/projects/${app.project?.id || app.projectId}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/80 border border-border/50 transition-colors group"
                  >
                    <span className="text-[11.5px] font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                      {app.project?.title || "Project"}
                    </span>
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded shrink-0 uppercase ${
                      app.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20" :
                      app.status === "REJECTED" ? "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      {app.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-[11.5px] text-muted-foreground italic py-1">No active applications.</p>
              )}
            </div>
          </div>

          {/* LIVE ACTIVITY FEED TIMELINE */}
          <div className="card p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Sparkles size={15} className="text-amber-500" /> Live Campus Stream
              </h3>
              <Link href="/dashboard?tab=notifications" className="text-[11px] font-bold text-accent hover:underline">
                View all →
              </Link>
            </div>

            {activityItems.length > 0 ? (
              <div className="space-y-2.5">
                {activityItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-secondary/50 transition-colors group"
                  >
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${item.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">{item.typeLabel}</span>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className="text-[9px] text-muted-foreground">
                          {item.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[11.5px] text-muted-foreground">No recent activity logged.</p>
            )}
          </div>

          {/* QUICK TEAMMATE FINDER WIDGET */}
          <div className="card p-5 space-y-3.5 bg-gradient-to-br from-card to-secondary/30">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-accent" />
              <h3 className="text-[13.5px] font-bold text-foreground">Need Teammates?</h3>
            </div>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              Browse student profiles from Computer Science, Engineering, and Design looking for project partners.
            </p>
            <Link
              href="/dashboard?tab=collaborations"
              className="w-full btn-secondary py-2 text-[11.5px] font-bold justify-center flex items-center gap-1.5 rounded-xl"
            >
              Open Collaborator Radar <ArrowUpRight size={13} />
            </Link>
          </div>

        </div>{/* END RIGHT CONTROL SIDEBAR */}

      </div>
    </div>
  );
}
