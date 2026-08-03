"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, X, Users, Send, CheckCheck, Folder, Star, AlertCircle,
  ArrowUpDown, ChevronLeft, ChevronRight, Mail, ExternalLink
} from "lucide-react";
import { getDeveloperReputation } from "@/lib/reputation/utils";

interface CollaborationsFinderTabProps {
  people: any[];
  currentUser?: any;
  collabSearch: string;
  setCollabSearch: (v: string) => void;
  collabDept: string;
  setCollabDept: (v: string) => void;
  collabSkill: string;
  setCollabSkill: (v: string) => void;
  collabStatus: "all" | "open" | "busy";
  setCollabStatus: (v: "all" | "open" | "busy") => void;
  hasProjects?: boolean;
  collabNextCursor?: number;
  collabHasMore?: boolean;
  onInviteUser?: (user: any) => void;
}

type SortKey = "recommended" | "rating" | "newest";

function tierColor(tier: string) {
  switch (tier?.toLowerCase()) {
    case "elite":    return { bg: "rgba(168,85,247,.1)", text: "#a855f7", border: "rgba(168,85,247,.2)" };
    case "excellent":return { bg: "rgba(16,185,129,.1)", text: "#10b981", border: "rgba(16,185,129,.2)" };
    case "strong":   return { bg: "rgba(59,130,246,.1)", text: "#3b82f6", border: "rgba(59,130,246,.2)" };
    case "growing":  return { bg: "rgba(245,158,11,.1)",  text: "#f59e0b", border: "rgba(245,158,11,.2)" };
    default:         return { bg: "var(--bg-surface-2)",  text: "var(--text-tertiary)", border: "var(--border)" };
  }
}

export default function CollaborationsFinderTab({
  people: initialPeople,
  currentUser,
  collabSearch, setCollabSearch,
  collabDept,   setCollabDept,
  collabSkill,  setCollabSkill,
  collabStatus, setCollabStatus,
  hasProjects = false,
  collabNextCursor,
  collabHasMore = false,
  onInviteUser,
}: CollaborationsFinderTabProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [rawPage, setRawPage] = useState(1);
  const PAGE_SIZE = 12;

  const [extraPeople, setExtraPeople] = useState<any[]>([]);
  const [extraNextCursor, setExtraNextCursor] = useState<number | null>(collabNextCursor ?? null);
  const [extraHasMore, setExtraHasMore] = useState(collabHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selected user for the preview pane
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isOpen = (u: any) => u.availability !== "BUSY";

  /* ── merged + de-duped people list ─────────────────────── */
  const allPeople = useMemo(() => {
    const raw = [...initialPeople, ...extraPeople];
    if (currentUser?.email || currentUser?.id) {
      const curEmail = currentUser.email?.toLowerCase().trim() || '';
      const curIdStr = currentUser.id ? String(currentUser.id) : '';
      const idx = raw.findIndex((u: any) => 
        (u.email && curEmail && u.email.toLowerCase().trim() === curEmail) || 
        (u.id && curIdStr && String(u.id) === curIdStr)
      );
      if (idx !== -1) raw[idx] = { ...raw[idx], ...currentUser };
      else raw.unshift(currentUser);
    }
    // De-dup by lowercase email AND string-normalized id
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();
    return raw.filter((u: any) => {
      const idKey = u.id ? String(u.id) : '';
      const emailKey = u.email ? u.email.toLowerCase().trim() : '';

      if (idKey && seenIds.has(idKey)) return false;
      if (emailKey && seenEmails.has(emailKey)) return false;

      if (idKey) seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);
      return true;
    });
  }, [initialPeople, extraPeople, currentUser]);

  const allDepts = useMemo(() =>
    Array.from(new Set(allPeople.map((u: any) => u.department as string).filter(Boolean))).sort(),
  [allPeople]);

  const allSkills = useMemo(() =>
    Array.from(new Set(allPeople.flatMap((u: any) =>
      (u.skills || []).map((s: any) => (typeof s === "string" ? s : s?.name) as string).filter(Boolean)
    ))).sort(),
  [allPeople]);

  /* ── filter ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = collabSearch.trim().toLowerCase();
    return allPeople.filter((u: any) => {
      if (q && !(u.name || "").toLowerCase().includes(q) &&
               !(u.email || "").toLowerCase().includes(q) &&
               !(u.department || "").toLowerCase().includes(q) &&
               !(u.bio ?? "").toLowerCase().includes(q) &&
               !(u.skills || []).some((s: any) => (s?.name || "").toLowerCase().includes(q))) return false;
      if (collabDept && u.department !== collabDept) return false;
      if (collabSkill && !(u.skills || []).some((s: any) => s?.name === collabSkill)) return false;
      if (collabStatus === "open" && !isOpen(u)) return false;
      if (collabStatus === "busy" &&  isOpen(u)) return false;
      return true;
    });
  }, [allPeople, collabSearch, collabDept, collabSkill, collabStatus]);

  /* ── sort ───────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const withRep = filtered.map((u: any) => ({ u, rep: getDeveloperReputation(u) }));
    if (sortKey === "rating") {
      withRep.sort((a, b) => {
        if (a.rep.githubConnected !== b.rep.githubConnected) return a.rep.githubConnected ? -1 : 1;
        return (b.rep.score ?? 0) - (a.rep.score ?? 0);
      });
    } else if (sortKey === "recommended") {
      withRep.sort((a, b) => {
        if (a.rep.githubConnected !== b.rep.githubConnected) return a.rep.githubConnected ? -1 : 1;
        return (b.rep.score ?? 0) - (a.rep.score ?? 0);
      });
    }
    return withRep;
  }, [filtered, sortKey]);

  /* ── pagination ─────────────────────────────────────────── */
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changePage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setRawPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadMore = async () => {
    if (!extraNextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/users?cursor=${extraNextCursor}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExtraPeople(prev => [...prev, ...data.users]);
      setExtraNextCursor(data.nextCursor);
      setExtraHasMore(data.hasMore);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  };

  const copyEmail = async (userId: number, email: string) => {
    try { await navigator.clipboard.writeText(email); } catch {
      const el = document.createElement("textarea");
      el.value = email; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find the selected user details
  const activeSelectedUser = useMemo(() => {
    if (paginated.length === 0) return null;
    const targetId = selectedUserId || String(paginated[0]?.u.id);
    const match = paginated.find(item => String(item.u.id) === targetId);
    return match || paginated[0];
  }, [paginated, selectedUserId]);

  const activeFilters = [
    collabDept   && { label: `Dept: ${collabDept}`, clear: () => setCollabDept("") },
    collabSkill  && { label: `Skill: ${collabSkill}`, clear: () => setCollabSkill("") },
    collabStatus !== "all" && { label: collabStatus === "open" ? "Available" : "Busy", clear: () => setCollabStatus("all") },
    collabSearch && { label: `"${collabSearch}"`, clear: () => setCollabSearch("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <>
      <style>{`
        /* Split view layout styling */
        .collab-layout {
          display: grid;
          grid-template-columns: 240px 1fr 340px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .collab-layout {
            grid-template-columns: 200px 1fr;
          }
          .collab-preview-pane {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .collab-layout {
            grid-template-columns: 1fr;
          }
          .collab-sidebar {
            display: none;
          }
        }

        /* Sidebar styles */
        .collab-sidebar-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          position: sticky;
          top: 80px;
        }

        .filter-section {
          margin-bottom: 20px;
        }
        .filter-section:last-child {
          margin-bottom: 0;
        }

        .filter-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          margin-bottom: 8px;
          display: block;
        }

        /* List pane style */
        .collab-list-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .collab-profile-row {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .collab-profile-row:hover {
          border-color: var(--text-tertiary);
          transform: translateY(-1px);
        }

        .collab-profile-row.selected {
          border-color: var(--accent);
          background: color-mix(in oklab, var(--accent) 3%, var(--bg-surface));
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.05);
        }

        .collab-profile-row.selected::before {
          content: "";
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: var(--accent);
        }

        /* Avatar */
        .avatar-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
          position: relative;
          flex-shrink: 0;
          overflow: hidden;
        }

        .status-badge-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-surface);
        }

        /* Details */
        .collab-row-info {
          min-width: 0;
          flex-1;
        }

        .collab-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .collab-row-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .collab-row-meta {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 1px;
        }

        .collab-row-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 6px;
        }

        .skill-badge {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        /* Mini rating tag */
        .rating-tag {
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid;
          white-space: nowrap;
        }

        .rating-tag-nr {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 600;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          color: var(--text-tertiary);
        }

        /* Dynamic Preview Panel */
        .collab-preview-pane {
          position: sticky;
          top: 80px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .preview-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          color: var(--text-primary);
          overflow: hidden;
        }

        /* Reputation Score Details visual components */
        .rep-stat-bar-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rep-stat-row {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .rep-progress-bg {
          height: 5px;
          border-radius: 10px;
          background: var(--bg-surface-2);
          overflow: hidden;
          width: 100%;
        }

        .rep-progress-fill {
          height: 100%;
          border-radius: 10px;
          background: var(--accent);
          transition: width 0.4s ease-out;
        }
      `}</style>

      <div ref={topRef} className="collab-layout">
        
        {/* ══ 1. SIDEBAR FILTER PANE ════════════════════════ */}
        <aside className="collab-sidebar">
          <div className="collab-sidebar-card">
            
            {/* Search */}
            <div className="filter-section">
              <label className="filter-label">Search</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={collabSearch}
                  onChange={e => { setCollabSearch(e.target.value); setRawPage(1); }}
                  placeholder="Name, skill, bio…"
                  className="collab-filter-input pl-8 pr-8 w-full"
                  style={{
                    paddingTop: "7px", paddingBottom: "7px", borderRadius: "8px",
                    border: "1px solid var(--border)", background: "var(--bg-surface)",
                    fontSize: "12px", outline: "none", color: "var(--text-primary)"
                  }}
                />
                {collabSearch && (
                  <button onClick={() => setCollabSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="filter-section">
              <span className="filter-label">Status</span>
              <div className="flex flex-col gap-1">
                {(["all", "open", "busy"] as const).map(s => {
                  const m = { all: "Everyone", open: "Available", busy: "Busy" }[s];
                  const active = collabStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => { setCollabStatus(s); setRawPage(1); }}
                      className={`text-[12px] font-medium px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                        active ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <span>{m}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s === "open" ? "bg-success" : s === "busy" ? "bg-warning" : "bg-muted-foreground/50"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department */}
            {allDepts.length > 0 && (
              <div className="filter-section">
                <label className="filter-label">Department</label>
                <select
                  value={collabDept}
                  onChange={e => { setCollabDept(e.target.value); setRawPage(1); }}
                  className="collab-filter-select w-full"
                  style={{
                    padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)",
                    background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "12px",
                    outline: "none", cursor: "pointer"
                  }}
                >
                  <option value="">All Departments</option>
                  {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Skills */}
            {allSkills.length > 0 && (
              <div className="filter-section">
                <label className="filter-label">Skill</label>
                <select
                  value={collabSkill}
                  onChange={e => { setCollabSkill(e.target.value); setRawPage(1); }}
                  className="collab-filter-select w-full"
                  style={{
                    padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)",
                    background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "12px",
                    outline: "none", cursor: "pointer"
                  }}
                >
                  <option value="">All Skills</option>
                  {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {activeFilters.length > 0 && (
              <button
                onClick={() => { setCollabSearch(""); setCollabDept(""); setCollabSkill(""); setCollabStatus("all"); setRawPage(1); }}
                className="w-full text-center mt-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* ══ 2. PROFILE LIST PANE ══════════════════════════ */}
        <div style={{ minWidth: 0 }}>
          
          {/* Mobile search bar */}
          <div className="block md:hidden mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={collabSearch}
                onChange={e => { setCollabSearch(e.target.value); setRawPage(1); }}
                placeholder="Search collaborators…"
                style={{
                  width: "100%", paddingLeft: "34px", paddingRight: "12px", paddingTop: "9px",
                  paddingBottom: "9px", borderRadius: "10px", border: "1px solid var(--border)",
                  background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Roster Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" />
              <span className="text-[13px] font-bold text-foreground">
                {filtered.length} {filtered.length === 1 ? "collaborator" : "collaborators"}
              </span>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-1 bg-secondary/35 p-1 rounded-lg border border-border">
              {(["recommended", "rating", "newest"] as SortKey[]).map(k => {
                const label = { recommended: "Recommended", rating: "Top Rated", newest: "Newest" }[k];
                const active = sortKey === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      active ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {activeFilters.map(f => (
                <button
                  key={f.label}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded bg-secondary/80 border border-border text-foreground hover:border-destructive hover:text-destructive cursor-pointer"
                >
                  {f.label} <X size={10} />
                </button>
              ))}
            </div>
          )}

          {/* Roster Cards List */}
          <div className="collab-list-container">
            {paginated.length > 0 ? paginated.map(({ u, rep }) => {
              const open = isOpen(u);
              const displayName = u.name || u.email?.split("@")[0] || "Student";
              const initial = (displayName[0] || "?").toUpperCase();
              const isMe = currentUser?.id && String(u.id) === String(currentUser.id);
              const tc = tierColor(rep.tier);
              const isSelected = activeSelectedUser && String(u.id) === String(activeSelectedUser.u.id);

              return (
                <div
                  key={String(u.id)}
                  onClick={() => setSelectedUserId(String(u.id))}
                  className={`collab-profile-row ${isSelected ? "selected" : ""}`}
                >
                  {/* Avatar wrapper */}
                  <div className="avatar-wrapper">
                    {u.profileImage ? (
                      <Image
                        src={u.profileImage}
                        alt={displayName}
                        width={44}
                        height={44}
                        className="object-cover h-full w-full"
                        unoptimized
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                    <span className="status-badge-dot" style={{ background: open ? "var(--success)" : "var(--warning)" }} />
                  </div>

                  {/* Profile Summary info */}
                  <div className="collab-row-info">
                    <div className="collab-row-header">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="collab-row-name">{displayName}</span>
                        {isMe && (
                          <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      
                      {/* Star rating tag */}
                      {rep.githubConnected && rep.score !== null ? (
                        <span className="rating-tag" style={{ background: tc.bg, borderColor: tc.border, color: tc.text }}>
                          <Star size={10} className="fill-current" />
                          <span>{rep.stars.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="rating-tag-nr">
                          <AlertCircle size={9.5} />
                          <span>Not Rated</span>
                        </span>
                      )}
                    </div>

                    <div className="collab-row-meta">
                      Year {u.year || 2} · {u.department || "Computer Science"}
                    </div>

                    {/* Skills pills */}
                    {u.skills && u.skills.length > 0 && (
                      <div className="collab-row-skills">
                        {u.skills.slice(0, 4).map((s: any) => (
                          <span key={s.id ?? s.name} className="skill-badge">
                            {s.name}
                          </span>
                        ))}
                        {u.skills.length > 4 && (
                          <span className="text-[9px] text-muted-foreground self-center">+{u.skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Users size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-[13px] font-bold text-foreground">No collaborators found</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">Try resetting or refining your filters.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <span className="text-[11.5px] text-muted-foreground">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}</strong> of <strong>{sorted.length}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  className="collab-page-btn p-1.5 border border-border bg-card rounded-lg hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                >
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    onClick={() => changePage(pNum)}
                    className={`h-7 min-w-[28px] text-[11px] font-bold rounded-lg border cursor-pointer transition-colors ${
                      page === pNum 
                        ? "bg-primary text-white border-primary" 
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  className="collab-page-btn p-1.5 border border-border bg-card rounded-lg hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page === totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Load more */}
          {extraHasMore && page === totalPages && (
            <div className="text-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-[12px] font-semibold px-4 py-2 border border-border bg-card rounded-xl hover:bg-secondary cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading more..." : "Load More Collaborators"}
              </button>
            </div>
          )}
        </div>

        {/* ══ 3. DYNAMIC PREVIEW DETAILS PANE ══════════════ */}
        {activeSelectedUser && (
          <aside className="collab-preview-pane">
            
            {/* Header / Avatar block */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-border/60">
              <div className="preview-avatar mb-3">
                {activeSelectedUser.u.profileImage ? (
                  <Image
                    src={activeSelectedUser.u.profileImage}
                    alt={activeSelectedUser.u.name || "User"}
                    width={64}
                    height={64}
                    className="object-cover h-full w-full"
                    unoptimized
                  />
                ) : (
                  <span>{(activeSelectedUser.u.name || "U")[0].toUpperCase()}</span>
                )}
              </div>
              <h3 className="text-[15px] font-bold text-foreground leading-snug">
                {activeSelectedUser.u.name || activeSelectedUser.u.email?.split("@")[0]}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Year {activeSelectedUser.u.year || 2} · {activeSelectedUser.u.department || "Computer Science"}
              </p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${isOpen(activeSelectedUser.u) ? "bg-success" : "bg-warning"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isOpen(activeSelectedUser.u) ? "Available" : "Busy"}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/profile/${activeSelectedUser.u.id}`}
                className="w-full py-2 text-center text-[12px] font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                View Full Profile
                <ExternalLink size={12} />
              </Link>

              {/* Invite button */}
              {activeSelectedUser.u.id !== currentUser?.id && hasProjects && onInviteUser ? (
                <button
                  onClick={() => onInviteUser(activeSelectedUser.u)}
                  className="w-full py-2 text-[12px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={12} /> Send Invite
                </button>
              ) : activeSelectedUser.u.id !== currentUser?.id ? (
                <button
                  onClick={() => copyEmail(activeSelectedUser.u.id, activeSelectedUser.u.email || "")}
                  className={`w-full py-2 text-[12px] font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    copiedId === activeSelectedUser.u.id 
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-secondary border-border text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {copiedId === activeSelectedUser.u.id ? (
                    <>
                      <CheckCheck size={12} /> Copied!
                    </>
                  ) : (
                    <>
                      <Mail size={12} /> Copy Email
                    </>
                  )}
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-center gap-4 py-1 text-muted-foreground border-b border-border/60 pb-3">
              {activeSelectedUser.u.githubUrl && (
                <a
                  href={activeSelectedUser.u.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  title="GitHub Profile"
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
                </a>
              )}
              {activeSelectedUser.u.linkedinUrl && (
                <a
                  href={activeSelectedUser.u.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  title="LinkedIn Profile"
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              )}
            </div>

            {/* Bio */}
            {activeSelectedUser.u.bio && (
              <div className="text-[11.5px] text-muted-foreground leading-relaxed">
                <span className="block font-bold text-foreground text-[10px] uppercase tracking-wider mb-1">About</span>
                <p className="italic">&ldquo;{activeSelectedUser.u.bio}&rdquo;</p>
              </div>
            )}

            {/* Reputation Score card */}
            <div>
              <span className="block font-bold text-foreground text-[10px] uppercase tracking-wider mb-2.5">Developer Reputation</span>
              
              {activeSelectedUser.rep.githubConnected && activeSelectedUser.rep.score !== null ? (
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] font-logo text-foreground leading-none">
                      {activeSelectedUser.rep.score}
                      <span className="text-[11px] text-muted-foreground font-normal">/100</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      ★ {activeSelectedUser.rep.stars.toFixed(1)}
                    </span>
                  </div>

                  {/* Weight breakdowns */}
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    <div className="rep-stat-bar-container">
                      <div className="flex justify-between rep-stat-row">
                        <span>GitHub Code Activity (70%)</span>
                        <span className="font-bold">{activeSelectedUser.rep.score}</span>
                      </div>
                      <div className="rep-progress-bg">
                        <div className="rep-progress-fill" style={{ width: `${activeSelectedUser.rep.score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 text-center">
                  <AlertCircle size={18} className="mx-auto mb-1.5 text-muted-foreground/50" />
                  <p className="text-[11.5px] font-bold text-foreground">GitHub Unconnected</p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">Reputation rating requires a verified GitHub profile link.</p>
                </div>
              )}
            </div>

            {/* Skills full listing */}
            {activeSelectedUser.u.skills && activeSelectedUser.u.skills.length > 0 && (
              <div>
                <span className="block font-bold text-foreground text-[10px] uppercase tracking-wider mb-2">Expertise</span>
                <div className="flex flex-wrap gap-1">
                  {activeSelectedUser.u.skills.map((s: any) => (
                    <span key={s.id ?? s.name} className="skill-badge px-2 py-0.5 text-[9.5px]">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
