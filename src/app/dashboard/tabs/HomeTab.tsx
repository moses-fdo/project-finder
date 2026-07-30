"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Folder, Bookmark, Send, Users, Trophy, Plus, Search, X, CheckCircle2,
  Calendar, MapPin, Globe, Sparkles, LucideIcon, Sprout, Brain, Dumbbell,
} from "lucide-react";
import { getNotificationLink } from "@/lib/notifications";

interface HomeTabProps {
  projects: any[];
  applications: any[];
  notifications: any[];
  currentUser: any;
  events: any[];
  hackathons: any[];
  recommendedProjects: any[];
  myProjectsSidebar: any[];
  myApplicationsSidebar: any[];
  recentNotifications: any[];
  bookmarkedIds: Set<number>;
  toggleBookmark: (id: number) => void;
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
  myProjectsSidebar,
  myApplicationsSidebar,
  recentNotifications,
  bookmarkedIds,
  toggleBookmark,
  getProjectIcon,
  nowMs,
  departments,
}: HomeTabProps) {
  const [dashSearch, setDashSearch] = useState("");
  const [dashCategory, setDashCategory] = useState("All");
  const [dashDept, setDashDept] = useState("");
  const [dashStatus, setDashStatus] = useState("ALL");
  const [dashPage, setDashPage] = useState(1);

  const eventsList = (events && events.length > 0) ? events : hackathons;

  const parseEventEndDate = (h: any): number | null => {
    const dateStr = h.endDate || h.date || h.startDate;
    if (!dateStr) return null;
    let endPart = dateStr;
    if (dateStr.includes(" - ")) endPart = dateStr.split(" - ").pop()!.trim();
    else if (dateStr.includes(" to ")) endPart = dateStr.split(" to ").pop()!.trim();
    else if (dateStr.includes("→")) endPart = dateStr.split("→").pop()!.trim();
    let d = new Date(endPart);
    if (isNaN(d.getTime())) d = new Date(`${endPart} ${new Date().getFullYear()}`);
    if (isNaN(d.getTime())) return null;
    if (!endPart.includes("T") && !endPart.includes(":")) d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  const activeEventsList = eventsList.filter((h: any) => {
    const endMs = parseEventEndDate(h);
    return endMs === null || endMs >= nowMs;
  });
  const topEvents = (activeEventsList.length > 0 ? activeEventsList : eventsList).slice(0, 4);

  const userProjects = projects.filter((p: any) => p.ownerId === currentUser?.id);
  const userApplications = applications || [];
  const activityNotifs = notifications || [];

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

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const currentProjects = filteredProjects.slice((dashPage - 1) * itemsPerPage, dashPage * itemsPerPage);

  return (
    <div className="space-y-7">
      {/* ═════════════════════════════════════════════════════
         MOBILE VIEW — MATCHES USER SCREENSHOT (md:hidden)
         ═════════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-6">
        {/* 1. Welcome Greeting + + New Project CTA Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-bold text-textPrimary tracking-tight leading-snug">
              Welcome back, {(currentUser?.name || "USER").toUpperCase()} 👋
            </h1>
            <p className="text-[11.5px] text-textMuted mt-0.5 leading-relaxed">
              Start by posting your first project and connecting with amazing collaborators.
            </p>
          </div>
          <Link
            href="/projects/create"
            className="btn-primary text-[11px] py-2 px-3 rounded-xl shrink-0 flex items-center gap-1 font-semibold"
          >
            <Plus size={13} strokeWidth={2} /> New Project
          </Link>
        </div>

        {/* Mobile Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
          <input
            type="text"
            value={dashSearch}
            onChange={(e) => { setDashSearch(e.target.value); setDashPage(1); }}
            placeholder="Search projects, technologies, teammates..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-card border border-border text-[12px] text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {dashSearch && (
            <button
              onClick={() => setDashSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 2. 4 Stat Cards Row */}
        <div className="grid grid-cols-4 gap-2">
          <Link href="/dashboard?tab=projects" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:bg-card-hover transition-all">
            <div className="h-7 w-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Folder size={14} />
            </div>
            <span className="text-[15px] font-extrabold text-textPrimary leading-none">{projects.length}</span>
            <span className="text-[9px] text-textMuted font-medium truncate w-full">My projects</span>
          </Link>

          <Link href="/dashboard?tab=applications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:bg-card-hover transition-all">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send size={14} />
            </div>
            <span className="text-[15px] font-extrabold text-textPrimary leading-none">{applications.length}</span>
            <span className="text-[9px] text-textMuted font-medium truncate w-full">Applications</span>
          </Link>

          <Link href="/dashboard?tab=applications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:bg-card-hover transition-all">
            <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bookmark size={14} />
            </div>
            <span className="text-[15px] font-extrabold text-textPrimary leading-none">{applications.filter((a: any) => a.status === "PENDING").length}</span>
            <span className="text-[9px] text-textMuted font-medium truncate w-full">Pending</span>
          </Link>

          <Link href="/dashboard?tab=notifications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:bg-card-hover transition-all">
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={14} />
            </div>
            <span className="text-[15px] font-extrabold text-textPrimary leading-none">{recentNotifications.filter((n: any) => !n.read).length}</span>
            <span className="text-[9px] text-textMuted font-medium truncate w-full">Unread</span>
          </Link>
        </div>

        {/* 3. Open to join Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-textPrimary">Open to join</h2>
            <Link href="/projects" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recommendedProjects && recommendedProjects.length > 0 ? (
              recommendedProjects.slice(0, 3).map((project) => {
                const iconInfo = getProjectIcon(project.title);
                const Icon = iconInfo.icon;
                const isBookmarked = bookmarkedIds.has(project.id);
                return (
                  <article key={project.id} className="card p-3.5 flex items-start gap-3 hover:bg-card-hover transition-all">
                    <div className={`h-10 w-10 rounded-xl ${iconInfo.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={18} className={iconInfo.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-[13px] font-bold text-textPrimary leading-snug line-clamp-1">
                          <Link href={`/projects/${project.id}`}>{project.title}</Link>
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {project.status === "OPEN" && <span className="badge badge-green text-[9px] font-bold">OPEN</span>}
                          {project.status === "FULL" && <span className="badge badge-yellow text-[9px] font-bold">FULL</span>}
                          {project.status === "CLOSED" && <span className="badge badge-red text-[9px] font-bold">CLOSED</span>}
                          <button
                            onClick={() => toggleBookmark(project.id)}
                            className={`p-0.5 rounded transition-colors ${isBookmarked ? "text-textPrimary" : "text-textMuted/40 hover:text-textMuted"}`}
                          >
                            <Bookmark size={12} className={isBookmarked ? "fill-textPrimary" : ""} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-textMuted line-clamp-2 leading-relaxed mb-2">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {project.skills?.slice(0, 3).map((skill: any) => (
                            <span key={skill.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-textMuted">
                              {skill.name}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-textMuted shrink-0 uppercase tracking-tight font-medium">by {project.owner?.name}</span>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="card p-6 text-center text-[12px] text-textMuted">No open projects right now.</div>
            )}
          </div>
        </div>

        {/* 4. 2-Column Side-by-Side Cards (My projects & Applications) */}
        <div className="grid grid-cols-2 gap-3">
          {/* My projects card */}
          <div className="card p-4 flex flex-col justify-between space-y-3 min-h-[160px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-textPrimary">My projects</h3>
              <Link href="/projects/create" className="text-[10px] font-semibold text-primary hover:underline">+ New</Link>
            </div>
            {myProjectsSidebar && myProjectsSidebar.length > 0 ? (
              <div className="space-y-2">
                {myProjectsSidebar.slice(0, 2).map((proj) => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="block text-[11px] font-medium text-textPrimary hover:underline truncate">
                    {proj.title}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <Folder size={24} className="mx-auto text-textMuted/40" />
                <p className="text-[10px] text-textMuted leading-tight">No projects yet.<br />Create your first project.</p>
                <Link href="/projects/create" className="btn-primary text-[10px] py-1 px-2.5 w-full block text-center rounded-lg font-bold">
                  Create Project
                </Link>
              </div>
            )}
          </div>

          {/* Applications card */}
          <div className="card p-4 flex flex-col justify-between space-y-3 min-h-[160px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-textPrimary">Applications</h3>
              <Link href="/dashboard?tab=applications" className="text-[10px] font-semibold text-primary hover:underline">View all</Link>
            </div>
            {myApplicationsSidebar && myApplicationsSidebar.length > 0 ? (
              <div className="space-y-2">
                {myApplicationsSidebar.slice(0, 2).map((app) => (
                  <Link key={app.id} href={`/projects/${app.project.id}`} className="block text-[11px] font-medium text-textPrimary hover:underline truncate">
                    {app.project.title}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <Send size={24} className="mx-auto text-textMuted/40" />
                <p className="text-[10px] text-textMuted leading-tight">No applications yet.<br />Browse and apply to exciting projects.</p>
                <Link href="/projects" className="btn-primary text-[10px] py-1 px-2.5 w-full block text-center rounded-lg font-bold">
                  Browse Projects
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 5. Recent activity Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-textPrimary">Recent activity</h2>
            <Link href="/dashboard?tab=notifications" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
              View all →
            </Link>
          </div>

          <div className="card divide-y divide-border/60 max-h-[300px] overflow-y-auto">
            {recentNotifications && recentNotifications.length > 0 ? (
              recentNotifications.slice(0, 4).map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationLink(notif)}
                  className="flex items-center gap-3 px-3.5 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${notif.read ? "bg-textMuted/30" : "bg-primary"}`} />
                  <p className="text-[11px] text-textPrimary flex-1 truncate leading-snug">{notif.message}</p>
                  <span className="text-[9.5px] text-textMuted shrink-0 font-medium ml-1">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-4 py-5 text-[11px] text-textMuted text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
         DESKTOP VIEW — PC UNIFIED LAYOUT (hidden md:flex)
         ═════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:gap-7 md:items-start">

        {/* ── LEFT MAIN FEED ─────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ROW 1: 4 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="card p-4 flex items-center gap-3.5 hover:bg-card-hover transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Folder size={18} />
              </div>
              <div>
                <p className="text-[18px] font-extrabold text-textPrimary leading-none">{projects.length}</p>
                <p className="text-[11px] text-textMuted font-medium mt-1">Total Projects</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3.5 hover:bg-card-hover transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-[18px] font-extrabold text-textPrimary leading-none">{projects.filter((p: any) => p.status === "OPEN").length}</p>
                <p className="text-[11px] text-textMuted font-medium mt-1">Open Projects</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3.5 hover:bg-card-hover transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[18px] font-extrabold text-textPrimary leading-none">{applications.length}</p>
                <p className="text-[11px] text-textMuted font-medium mt-0.5">Applications</p>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3.5 hover:bg-card-hover transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Trophy size={16} />
              </div>
              <div>
                <p className="text-[18px] font-extrabold text-textPrimary leading-none">{eventsList.length}</p>
                <p className="text-[11px] text-textMuted font-medium mt-0.5">Hackathons</p>
              </div>
            </div>
          </div>

          {/* ROW 2: Top Events & Competitions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h2 className="text-[15px] font-bold text-textPrimary tracking-tight">Top Events &amp; Competitions</h2>
              </div>
              <Link href="/dashboard?tab=events" className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1">
                View all events →
              </Link>
            </div>

            {topEvents.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto snap-x scrollbar-none pb-3 pt-1">
                {topEvents.map((h: any) => {
                  const locationStr = [h.location, h.city, h.state, h.country].filter(Boolean).join(", ") || h.location || "Online";
                  const mainPrize = h.prize ? (h.prize.includes("|") ? h.prize.split("|")[0].trim() : h.prize) : null;

                  return (
                    <div key={h.id} className="w-[300px] shrink-0 snap-start card p-4.5 space-y-3 flex flex-col justify-between bg-card rounded-2xl hover:bg-card-hover transition-all shadow-xs group">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9.5px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-secondary text-textMuted border border-border/80">
                          {h.organizerType || "HACKATHON"}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          Live
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-[13.5px] font-bold text-textPrimary leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {h.title}
                        </h3>
                        <p className="text-[11px] text-textMuted line-clamp-1">
                          Organized by <span className="font-semibold text-textPrimary/90">{h.organizer || "Campus Partner"}</span>
                        </p>
                      </div>

                      {mainPrize && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-400 truncate flex items-center gap-1.5">
                            🏆 {mainPrize}
                          </span>
                          {h.prize?.includes("|") && (
                            <span className="text-[9.5px] text-amber-400/80 font-medium shrink-0">+more</span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1 text-[10.5px] text-textMuted border-t border-border/50 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Calendar size={10} className="shrink-0" /> Dates:</span>
                          <span className="font-semibold text-textPrimary truncate max-w-[140px]">{h.startDate ? `${h.startDate}${h.endDate ? ` → ${h.endDate}` : ""}` : (h.date || "TBA")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><MapPin size={10} className="shrink-0" /> Venue:</span>
                          <span className="font-semibold text-textPrimary truncate max-w-[140px]">{locationStr}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Globe size={10} className="shrink-0" /> Mode &amp; Fee:</span>
                          <span className="font-semibold text-textPrimary">{h.mode || "In-Person"} • {h.registrationFee || "Free"}</span>
                        </div>
                      </div>

                      <div className="border-t border-border/60 pt-3 mt-auto">
                        <a
                          href={h.link || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full btn-primary py-2 text-[12px] font-bold justify-center flex items-center gap-1 rounded-xl"
                        >
                          Register Now ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-6 text-center text-[12px] text-textMuted">No upcoming events right now.</div>
            )}
          </div>

          {/* ROW 3: Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "AI", "Web", "IoT", "Robotics", "Research", "Hackathon", "Productivity", "Design"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setDashCategory(cat); setDashPage(1); }}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    dashCategory === cat
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-secondary/60 text-textMuted hover:text-textPrimary"
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
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-card border border-border text-textPrimary cursor-pointer focus:outline-none"
              >
                <option value="">Department ▾</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={dashStatus}
                onChange={(e) => { setDashStatus(e.target.value); setDashPage(1); }}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-card border border-border text-textPrimary cursor-pointer focus:outline-none"
              >
                <option value="ALL">Status ▾</option>
                <option value="OPEN">Open</option>
                <option value="FULL">Full</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* ROW 4: Projects Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-[14px] font-bold text-textPrimary">{filteredProjects.length} Projects Found</h3>
            </div>

            {currentProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentProjects.map((project: any) => (
                  <div key={project.id} className="card p-4 space-y-3 flex flex-col justify-between hover:bg-card-hover transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project.status === "OPEN" && <span className="badge badge-green text-[9px] font-bold">OPEN</span>}
                        {project.status === "FULL" && <span className="badge badge-yellow text-[9px] font-bold">FULL</span>}
                        {project.status === "CLOSED" && <span className="badge badge-red text-[9px] font-bold">CLOSED</span>}
                        {project.status === "DONE" && <span className="badge badge-green text-[9px] font-bold">✓ DONE</span>}
                        {(() => {
                          const match = getSkillMatchScore(currentUser?.skills, project.skills);
                          if (!match.totalRequired || match.matchingCount === 0) return null;
                          return (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                              ⚡ {match.matchLabel}
                            </span>
                          );
                        })()}
                      </div>

                      <h4 className="text-[13px] font-bold text-textPrimary leading-snug line-clamp-1 hover:underline">
                        <Link href={`/projects/${project.id}`}>{project.title}</Link>
                      </h4>

                      <p className="text-[11px] text-textMuted line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.skills?.slice(0, 3).map((skill: any) => (
                          <span key={skill.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-textMuted">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[9px] shrink-0">
                          {(project.owner?.name?.[0] || "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-textPrimary truncate">{project.owner?.name || "Student"}</p>
                          <p className="text-[8px] text-textMuted truncate">{project.owner?.department || "Campus"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-textPrimary">{project.teamSize ? `1/${project.teamSize}` : "Team"}</p>
                        <p className="text-[8px] text-textMuted">Members</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center text-[12px] text-textMuted">No projects match the selected filters.</div>
            )}

            {/* View all projects link */}
            <div className="text-center pt-1">
              <Link href="/projects" className="text-[12px] font-semibold text-primary hover:underline">
                View all projects →
              </Link>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setDashPage(p => Math.max(1, p - 1))}
                  disabled={dashPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setDashPage(pNum)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      dashPage === pNum
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-card border border-border text-textMuted hover:text-textPrimary"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  onClick={() => setDashPage(p => Math.min(totalPages, p + 1))}
                  disabled={dashPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
                >
                  ›
                </button>
              </div>
            )}
          </div>

        </div>{/* end left main column */}

        {/* ── RIGHT SIDEBAR (sticky) ────────────────────────── */}
        <div className="w-[280px] shrink-0 space-y-4 sticky top-20 self-start">

          {/* My Projects Card */}
          <div className="card p-4 space-y-3 bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-purple-400 shrink-0" />
                <h3 className="text-[13px] font-bold text-textPrimary">My Projects</h3>
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {userProjects.length}
                </span>
              </div>
              <Link href="/projects/create" className="text-[11px] font-bold text-primary hover:underline">
                View all →
              </Link>
            </div>

            {userProjects.length > 0 ? (
              <div className="space-y-2">
                {userProjects.slice(0, 3).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/70 border border-border/40 transition-colors group"
                  >
                    <p className="text-[11.5px] font-semibold text-textPrimary truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </p>
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                      p.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      p.status === "FULL" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center space-y-2">
                <p className="text-[11px] text-textMuted">No projects created yet.</p>
                <Link href="/projects/create" className="btn-primary text-[10.5px] py-1 px-3 inline-flex items-center gap-1 font-bold rounded-lg">
                  + Create Project
                </Link>
              </div>
            )}
          </div>

          {/* My Applications Card */}
          <div className="card p-4 space-y-3 bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-blue-400 shrink-0" />
                <h3 className="text-[13px] font-bold text-textPrimary">My Applications</h3>
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {userApplications.length}
                </span>
              </div>
              <Link href="/dashboard?tab=applications" className="text-[11px] font-bold text-primary hover:underline">
                View all →
              </Link>
            </div>

            {userApplications.length > 0 ? (
              <div className="space-y-2">
                {userApplications.slice(0, 3).map((app: any) => (
                  <Link
                    key={app.id}
                    href={`/projects/${app.project?.id || app.projectId}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/70 border border-border/40 transition-colors group"
                  >
                    <p className="text-[11.5px] font-semibold text-textPrimary truncate group-hover:text-primary transition-colors">
                      {app.project?.title || "Project"}
                    </p>
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                      app.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      app.status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {app.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center space-y-2">
                <p className="text-[11px] text-textMuted">No active applications.</p>
                <Link href="/projects" className="btn-primary text-[10.5px] py-1 px-3 inline-flex items-center gap-1 font-bold rounded-lg">
                  Browse Projects
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="card p-4 space-y-3 bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <h3 className="text-[13px] font-bold text-textPrimary">Recent Activity</h3>
              </div>
              <Link href="/dashboard?tab=notifications" className="text-[11px] font-bold text-primary hover:underline">
                View all →
              </Link>
            </div>

            {activityNotifs.length > 0 ? (
              <div className="space-y-1 divide-y divide-border/30">
                {activityNotifs.slice(0, 4).map((notif: any) => (
                  <Link
                    key={notif.id}
                    href={getNotificationLink(notif)}
                    className="flex items-start gap-2 py-2 first:pt-0 last:pb-0 hover:bg-secondary/20 px-1 rounded-lg transition-colors group"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${notif.read ? "bg-textMuted/30" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-textPrimary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {notif.message}
                      </p>
                      <p className="text-[9.5px] text-textMuted mt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-textMuted">No recent activity.</p>
            )}
          </div>

        </div>{/* end right sidebar */}

      </div>{/* end hidden md:flex desktop view */}
    </div>
  );
}
