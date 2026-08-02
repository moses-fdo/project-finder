"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, X, Users, Send, CheckCheck, SlidersHorizontal,
  ChevronLeft, ChevronRight, Folder, Star, AlertCircle,
  ArrowUpDown,
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

/* ─── Tier helpers ──────────────────────────────────────────── */
function tierColor(tier: string) {
  switch (tier?.toLowerCase()) {
    case "elite":    return { dot: "#a855f7", bg: "rgba(168,85,247,.12)", text: "#a855f7", border: "rgba(168,85,247,.3)" };
    case "excellent":return { dot: "#10b981", bg: "rgba(16,185,129,.12)", text: "#10b981", border: "rgba(16,185,129,.3)" };
    case "strong":   return { dot: "#3b82f6", bg: "rgba(59,130,246,.12)", text: "#3b82f6", border: "rgba(59,130,246,.3)" };
    case "growing":  return { dot: "#f59e0b", bg: "rgba(245,158,11,.12)",  text: "#f59e0b", border: "rgba(245,158,11,.3)" };
    default:         return { dot: "#6b7280", bg: "rgba(107,114,128,.1)",  text: "#6b7280", border: "rgba(107,114,128,.2)" };
  }
}

/* ─── Star strip ─────────────────────────────────────────── */
function StarStrip({ stars }: { stars: number }) {
  return (
    <span className="collab-stars" aria-label={`${stars} stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.min(1, Math.max(0, stars - (n - 1)));
        return (
          <span key={n} className="collab-star-wrap">
            <Star size={11} className="collab-star-empty" />
            {fill > 0 && (
              <span className="collab-star-fill" style={{ width: `${fill * 100}%` }}>
                <Star size={11} className="collab-star-full" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
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
  const [copiedId, setCopiedId]     = useState<number | null>(null);
  const [sortKey, setSortKey]       = useState<SortKey>("recommended");
  const [rawPage, setRawPage]       = useState(1);
  const PAGE_SIZE                   = 15;

  const [extraPeople, setExtraPeople]         = useState<any[]>([]);
  const [extraNextCursor, setExtraNextCursor] = useState<number | null>(collabNextCursor ?? null);
  const [extraHasMore, setExtraHasMore]       = useState(collabHasMore);
  const [loadingMore, setLoadingMore]         = useState(false);

  const isOpen = (u: any) => u.availability !== "BUSY";

  /* ── merged + de-duped people list ─────────────────────── */
  const allPeople = useMemo(() => {
    const raw = [...initialPeople, ...extraPeople];
    if (currentUser?.id) {
      // Normalize to String so session id "4" === DB id 4
      const curIdStr = String(currentUser.id);
      const idx = raw.findIndex((u: any) => String(u.id) === curIdStr);
      if (idx !== -1) raw[idx] = { ...raw[idx], ...currentUser };
      else raw.unshift(currentUser);
    }
    // De-dup by string id to handle mixed string/number id types
    const seen = new Set<string>();
    return raw.filter((u: any) => {
      const key = String(u.id);
      if (seen.has(key)) return false;
      seen.add(key);
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
    // "newest" keeps server order
    return withRep;
  }, [filtered, sortKey]);

  /* ── pagination ─────────────────────────────────────────── */
  const totalPages   = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const page         = Math.min(Math.max(1, rawPage), totalPages);
  const paginated    = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changePage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setRawPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadMore = async () => {
    if (!extraNextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res  = await fetch(`/api/users?cursor=${extraNextCursor}`);
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

  const activeFilters = [
    collabDept   && { label: `Dept: ${collabDept}`,               clear: () => setCollabDept("") },
    collabSkill  && { label: `Skill: ${collabSkill}`,             clear: () => setCollabSkill("") },
    collabStatus !== "all" && { label: collabStatus === "open" ? "Available" : "Busy", clear: () => setCollabStatus("all") },
    collabSearch && { label: `"${collabSearch}"`,                 clear: () => setCollabSearch("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  /* ─────────────────────── RENDER ────────────────────────── */
  return (
    <>
      {/* Scoped styles */}
      <style>{`
        .collab-root { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 768px) { .collab-root { grid-template-columns: 1fr; } }

        .collab-sidebar { position: sticky; top: 80px; }

        /* ── Row ── */
        .collab-row {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 0 14px;
          align-items: center;
          padding: 13px 16px;
          border-bottom: 1px solid var(--border);
          transition: background 150ms cubic-bezier(0.16,1,0.3,1);
          cursor: default;
        }
        .collab-row:last-child { border-bottom: none; }
        .collab-row:hover { background: var(--bg-surface-2); }
        .collab-row.is-me { background: rgba(108,92,231,.04); border-left: 2px solid var(--accent); }

        /* ── Avatar ── */
        .collab-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--bg-surface-2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 15px; color: var(--text-primary);
          overflow: hidden; flex-shrink: 0; position: relative;
        }
        .collab-avail-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 10px; height: 10px; border-radius: 50%;
          border: 1.5px solid var(--bg-surface);
        }

        /* ── Identity ── */
        .collab-identity { min-width: 0; }
        .collab-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .collab-name {
          font-size: 13.5px; font-weight: 700; color: var(--text-primary);
          text-decoration: none; white-space: nowrap;
          transition: color 120ms;
        }
        .collab-name:hover { color: var(--accent); }
        .collab-meta { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
        .collab-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .collab-skill-tag {
          font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
          background: var(--bg-surface-2); border: 1px solid var(--border);
          color: var(--text-secondary); cursor: pointer; transition: all 120ms;
          white-space: nowrap;
        }
        .collab-skill-tag:hover { border-color: var(--accent); color: var(--accent); }
        .collab-skill-tag.active { background: rgba(108,92,231,.1); border-color: rgba(108,92,231,.4); color: var(--accent); }

        /* ── Rep badge ── */
        .collab-rep {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px 2px 6px; border-radius: 5px; border: 1px solid;
          font-size: 10.5px; font-weight: 700; white-space: nowrap;
        }
        .collab-rep-nr {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 5px;
          background: var(--bg-surface-2); border: 1px solid var(--border);
          font-size: 10px; font-weight: 600; color: var(--text-tertiary);
        }

        /* ── Stars ── */
        .collab-stars { display: inline-flex; gap: 1px; }
        .collab-star-wrap { position: relative; display: inline-block; width: 11px; height: 11px; }
        .collab-star-empty { position: absolute; inset: 0; color: var(--border); opacity: 0.5; }
        .collab-star-fill { position: absolute; inset: 0; overflow: hidden; }
        .collab-star-full { color: #f59e0b; }

        /* ── Actions ── */
        .collab-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .collab-btn-view {
          font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 7px;
          border: 1px solid var(--border); background: transparent; color: var(--text-secondary);
          text-decoration: none; display: inline-flex; align-items: center;
          transition: all 140ms; white-space: nowrap; cursor: pointer;
        }
        .collab-btn-view:hover { background: var(--bg-surface-2); border-color: var(--text-tertiary); color: var(--text-primary); }
        .collab-btn-invite {
          font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 7px;
          border: 1px solid rgba(108,92,231,.4); background: rgba(108,92,231,.1);
          color: var(--accent); display: inline-flex; align-items: center; gap: 5px;
          transition: all 140ms; white-space: nowrap; cursor: pointer;
        }
        .collab-btn-invite:hover { background: rgba(108,92,231,.18); }
        .collab-btn-invite.copied { background: rgba(34,197,94,.1); border-color: rgba(34,197,94,.4); color: #16a34a; }

        /* ── Stat chips in action col ── */
        .collab-stat { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-tertiary); }

        /* ── Sidebar filter ── */
        .collab-filter-section { margin-bottom: 20px; }
        .collab-filter-label {
          font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          color: var(--text-tertiary); margin-bottom: 6px; display: block;
        }
        .collab-filter-option {
          display: flex; align-items: center; gap: 8px; padding: 6px 9px; border-radius: 7px;
          font-size: 12px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; transition: all 120ms; border: 1px solid transparent;
          width: 100%; text-align: left; background: none;
        }
        .collab-filter-option:hover { background: var(--bg-surface-2); color: var(--text-primary); }
        .collab-filter-option.active {
          background: rgba(108,92,231,.08); border-color: rgba(108,92,231,.25);
          color: var(--accent); font-weight: 700;
        }
        .collab-filter-input {
          width: 100%; padding: 7px 10px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg-surface);
          color: var(--text-primary); font-size: 12px;
          outline: none; transition: border 140ms;
        }
        .collab-filter-input:focus { border-color: var(--accent); }
        .collab-filter-select {
          width: 100%; padding: 6px 10px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg-surface);
          color: var(--text-primary); font-size: 12px;
          outline: none; cursor: pointer; transition: border 140ms;
          appearance: none;
        }
        .collab-filter-select:focus { border-color: var(--accent); }

        /* ── Pagination ── */
        .collab-page-btn {
          min-width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
          border-radius: 7px; border: 1px solid var(--border); background: var(--bg-surface);
          font-size: 12px; font-weight: 600; color: var(--text-tertiary); cursor: pointer;
          transition: all 140ms;
        }
        .collab-page-btn:hover:not(:disabled) { color: var(--text-primary); border-color: var(--text-tertiary); }
        .collab-page-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .collab-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        @media (prefers-reduced-motion: reduce) {
          .collab-row, .collab-btn-view, .collab-btn-invite, .collab-filter-option { transition: none; }
        }
      `}</style>

      <div ref={topRef} className="collab-root">

        {/* ══ LEFT SIDEBAR ════════════════════════════════════ */}
        <aside className="collab-sidebar hidden md:block">
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 14px" }}>

            {/* Search */}
            <div className="collab-filter-section">
              <label className="collab-filter-label">Search</label>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={collabSearch}
                  onChange={e => { setCollabSearch(e.target.value); setRawPage(1); }}
                  placeholder="Name, skill, dept…"
                  className="collab-filter-input"
                  style={{ paddingLeft: 30, paddingRight: collabSearch ? 28 : 10 }}
                />
                {collabSearch && (
                  <button onClick={() => setCollabSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="collab-filter-section">
              <span className="collab-filter-label">Availability</span>
              {(["all", "open", "busy"] as const).map(s => {
                const map = { all: { label: "Everyone", color: "#6b7280" }, open: { label: "Available", color: "#10b981" }, busy: { label: "Busy", color: "#f59e0b" } };
                const m = map[s];
                return (
                  <button key={s} className={`collab-filter-option ${collabStatus === s ? "active" : ""}`} onClick={() => { setCollabStatus(s); setRawPage(1); }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Department */}
            {allDepts.length > 0 && (
              <div className="collab-filter-section">
                <label className="collab-filter-label">Department</label>
                <select
                  value={collabDept}
                  onChange={e => { setCollabDept(e.target.value); setRawPage(1); }}
                  className="collab-filter-select"
                >
                  <option value="">All departments</option>
                  {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Skills */}
            {allSkills.length > 0 && (
              <div className="collab-filter-section">
                <label className="collab-filter-label">Skill</label>
                <select
                  value={collabSkill}
                  onChange={e => { setCollabSkill(e.target.value); setRawPage(1); }}
                  className="collab-filter-select"
                >
                  <option value="">All skills</option>
                  {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Clear all */}
            {activeFilters.length > 0 && (
              <button
                onClick={() => { setCollabSearch(""); setCollabDept(""); setCollabSkill(""); setCollabStatus("all"); setRawPage(1); }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4 }}
              >
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* ══ RIGHT PANEL ══════════════════════════════════════ */}
        <div style={{ minWidth: 0 }}>

          {/* ── Mobile search bar ── */}
          <div className="block md:hidden" style={{ marginBottom: 12 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input
                type="text" value={collabSearch}
                onChange={e => { setCollabSearch(e.target.value); setRawPage(1); }}
                placeholder="Search collaborators…"
                style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>

          {/* ── Toolbar row ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={15} style={{ color: "var(--text-tertiary)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {filtered.length} {filtered.length === 1 ? "student" : "students"}
              </span>
              {activeFilters.length > 0 && (
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>— filtered</span>
              )}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ArrowUpDown size={12} style={{ color: "var(--text-tertiary)" }} />
              {(["recommended", "rating", "newest"] as SortKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                    border: sortKey === k ? "1px solid rgba(108,92,231,.35)" : "1px solid var(--border)",
                    background: sortKey === k ? "rgba(108,92,231,.08)" : "var(--bg-surface)",
                    color: sortKey === k ? "var(--accent)" : "var(--text-secondary)",
                    transition: "all 140ms",
                  }}
                >
                  {{ recommended: "Recommended", rating: "Highest Rated", newest: "Newest" }[k]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Active filter chips (mobile too) ── */}
          {activeFilters.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {activeFilters.map(f => (
                <button key={f.label} onClick={f.clear}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-surface-2)", color: "var(--text-secondary)", cursor: "pointer" }}>
                  {f.label} <X size={10} />
                </button>
              ))}
            </div>
          )}

          {/* ── Roster table ── */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: "0 14px", padding: "9px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface-2)" }}>
              <div />
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Student</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Rating</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Actions</span>
            </div>

            {/* Rows */}
            {paginated.length > 0 ? paginated.map(({ u, rep }) => {
              const open        = isOpen(u);
              const displayName = u.name || u.email?.split("@")[0] || "Student";
              const initial     = (displayName[0] || "?").toUpperCase();
              const isMe        = currentUser?.id && String(u.id) === String(currentUser.id);
              const tc          = tierColor(rep.tier);
              const projCount   = (u.projects || []).length;
              const collabCount = (u.applications || []).filter((a: any) => a.status === "ACCEPTED").length;

              return (
                <div key={String(u.id)} className={`collab-row${isMe ? " is-me" : ""}`}>

                  {/* Avatar */}
                  <div className="collab-avatar">
                    {u.profileImage
                      ? <Image src={u.profileImage} alt={displayName} width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                      : initial
                    }
                    <span className="collab-avail-dot" style={{ background: open ? "#10b981" : "#f59e0b" }} />
                  </div>

                  {/* Identity + meta */}
                  <div className="collab-identity">
                    <div className="collab-name-row">
                      <Link href={`/profile/${u.id}`} className="collab-name">{displayName}</Link>
                      {isMe && <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 3, background: "rgba(108,92,231,.12)", color: "var(--accent)", border: "1px solid rgba(108,92,231,.3)", textTransform: "uppercase", letterSpacing: ".08em" }}>You</span>}
                      {/* Rep badge — inline with name */}
                      {rep.githubConnected && rep.score !== null ? (
                        <span className="collab-rep" style={{ background: tc.bg, borderColor: tc.border, color: tc.text }}>
                          <Star size={10} style={{ fill: "currentColor" }} />
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{rep.stars.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="collab-rep-nr">
                          <AlertCircle size={10} style={{ opacity: .6 }} />
                          Not Rated
                        </span>
                      )}
                    </div>

                    <div className="collab-meta">
                      Year {u.year || 2} · {u.department || "Computer Science"}
                      {" · "}
                      <span style={{ color: open ? "#10b981" : "#f59e0b" }}>{open ? "Available" : "Busy"}</span>
                    </div>

                    {u.skills && u.skills.length > 0 && (
                      <div className="collab-skills">
                        {u.skills.slice(0, 5).map((s: any) => (
                          <button
                            key={s.id ?? s.name}
                            className={`collab-skill-tag${collabSkill === s.name ? " active" : ""}`}
                            onClick={() => setCollabSkill(collabSkill === s.name ? "" : s.name)}
                          >
                            {s.name}
                          </button>
                        ))}
                        {u.skills.length > 5 && (
                          <span style={{ fontSize: 10, color: "var(--text-tertiary)", alignSelf: "center" }}>+{u.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions col */}
                  <div className="collab-actions">
                    {/* Mini stats */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginRight: 8 }}>
                      <span className="collab-stat"><Folder size={10} />{projCount} Projects</span>
                      <span className="collab-stat"><Users size={10} />{collabCount} Collabs</span>
                    </div>

                    <Link href={`/profile/${u.id}`} className="collab-btn-view">Profile</Link>

                    {u.id !== currentUser?.id && hasProjects && onInviteUser ? (
                      <button type="button" className="collab-btn-invite" onClick={() => onInviteUser(u)}>
                        <Send size={11} /> Invite
                      </button>
                    ) : u.id !== currentUser?.id ? (
                      <button type="button" className={`collab-btn-invite${copiedId === u.id ? " copied" : ""}`}
                        onClick={() => copyEmail(u.id, u.email ?? "")}>
                        {copiedId === u.id ? <CheckCheck size={11} /> : <Send size={11} />}
                        {copiedId === u.id ? "Copied!" : "Invite"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: "56px 24px", textAlign: "center" }}>
                <Users size={28} style={{ margin: "0 auto 10px", color: "var(--text-tertiary)", opacity: 0.4 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No students found</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {sorted.length > PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Showing <strong style={{ color: "var(--text-primary)" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}</strong> of <strong style={{ color: "var(--text-primary)" }}>{sorted.length}</strong>
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className="collab-page-btn" disabled={page === 1} onClick={() => changePage(page - 1)}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pNum = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                  if (pNum < 1 || pNum > totalPages) return null;
                  return (
                    <button key={pNum} className={`collab-page-btn${pNum === page ? " active" : ""}`} onClick={() => changePage(pNum)}>
                      {pNum}
                    </button>
                  );
                })}
                <button className="collab-page-btn" disabled={page === totalPages} onClick={() => changePage(page + 1)}>
                  <ChevronRight size={13} />
                </button>
              </div>

              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* ── Load more ── */}
          {extraHasMore && page === totalPages && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button type="button" onClick={loadMore} disabled={loadingMore}
                style={{ fontSize: 12, fontWeight: 600, padding: "8px 24px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)", cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}>
                {loadingMore ? "Loading…" : "Load more students"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
