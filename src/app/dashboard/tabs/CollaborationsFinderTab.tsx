"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Users,
  Folder,
  Send,
  CheckCheck,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [rawPage, setRawPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const [extraPeople, setExtraPeople] = useState<any[]>([]);
  const [extraNextCursor, setExtraNextCursor] = useState<number | null>(collabNextCursor ?? null);
  const [extraHasMore, setExtraHasMore] = useState(collabHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const people = [...initialPeople, ...extraPeople];

  const loadMore = async () => {
    const cursor = extraNextCursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/users?cursor=${cursor}`);
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      setExtraPeople(prev => [...prev, ...data.users]);
      setExtraNextCursor(data.nextCursor);
      setExtraHasMore(data.hasMore);
    } catch (e) {
      console.error("Failed to load more collaborators:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const isOpenToWork = (u: any) => {
    return u.availability !== "BUSY";
  };

  const allDepts = Array.from(
    new Set(people.map((u: any) => u.department as string).filter(Boolean))
  ).sort();

  const allSkills = Array.from(
    new Set(people.flatMap((u: any) => (u.skills || []).map((s: any) => s?.name as string).filter(Boolean)))
  ).sort();

  const filtered = people.filter((u: any) => {
    const q = collabSearch.trim().toLowerCase();
    if (
      q &&
      !(u.name || "").toLowerCase().includes(q) &&
      !(u.email || "").toLowerCase().includes(q) &&
      !(u.department || "").toLowerCase().includes(q) &&
      !(u.bio ?? "").toLowerCase().includes(q) &&
      !(u.skills || []).some((s: any) => (s?.name || "").toLowerCase().includes(q))
    ) return false;
    if (collabDept && u.department !== collabDept) return false;
    if (collabSkill && !(u.skills || []).some((s: any) => s?.name === collabSkill)) return false;
    if (collabStatus === "open" && !isOpenToWork(u)) return false;
    if (collabStatus === "busy" &&  isOpenToWork(u)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const paginatedPeople = filtered.slice((page - 1) * pageSize, page * pageSize);
  const displayPeople = isDesktop ? paginatedPeople.slice(0, 8) : paginatedPeople;

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setRawPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyEmail = async (userId: number, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const el = document.createElement("textarea");
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectBg = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 8px center",
  };

  return (
    <div ref={topRef} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
              Find collaborators
              <Users size={20} className="text-indigo-400" />
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-textMuted text-xs font-semibold border border-border">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-textMuted mt-1">
            Connect with verified students across campus and build project teams.
          </p>
        </div>
      </div>

      <div className="relative block sm:hidden">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
        <input
          type="text"
          value={collabSearch}
          onChange={(e) => setCollabSearch(e.target.value)}
          placeholder="Search by name, skill, department..."
          className="forge-input pl-9 pr-9 py-2.5 w-full bg-card rounded-xl text-xs"
        />
        {collabSearch && (
          <button
            onClick={() => setCollabSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-secondary/30 rounded-2xl border border-border/80">
        <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border/60">
          <button
            onClick={() => setCollabStatus("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "all"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            All
          </button>

          <button
            onClick={() => setCollabStatus("open")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "open"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Available
          </button>

          <button
            onClick={() => setCollabStatus("busy")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "busy"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Busy
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden sm:block w-48 lg:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
            <input
              type="text"
              value={collabSearch}
              onChange={(e) => setCollabSearch(e.target.value)}
              placeholder="Search..."
              className="forge-input pl-9 pr-7 py-1.5 w-full bg-card rounded-lg text-xs"
            />
            {collabSearch && (
              <button onClick={() => setCollabSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-textMuted">
                <X size={11} />
              </button>
            )}
          </div>

          <select
            value={collabDept}
            onChange={(e) => setCollabDept(e.target.value)}
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-textPrimary focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option value="">Departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={collabSkill}
            onChange={(e) => setCollabSkill(e.target.value)}
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-textPrimary focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option value="">Skills</option>
            {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-textPrimary focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option>Sort by: Recommended</option>
            <option>Newest First</option>
            <option>Highest Rated</option>
          </select>

          <button className="p-2 bg-card border border-border rounded-lg text-textMuted hover:text-textPrimary cursor-pointer">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {(collabDept || collabSkill || collabSearch || collabStatus !== "all") && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-textMuted font-medium mr-1">Active filters:</span>
          {collabDept && (
            <button
              onClick={() => setCollabDept("")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-textPrimary border border-border hover:bg-secondary"
            >
              Dept: {collabDept} <X size={11} />
            </button>
          )}
          {collabSkill && (
            <button
              onClick={() => setCollabSkill("")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-textPrimary border border-border hover:bg-secondary"
            >
              Skill: {collabSkill} <X size={11} />
            </button>
          )}
          {collabStatus !== "all" && (
            <button
              onClick={() => setCollabStatus("all")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-textPrimary border border-border hover:bg-secondary"
            >
              Status: {collabStatus === "open" ? "Available" : "Busy"} <X size={11} />
            </button>
          )}
          <button
            onClick={() => {
              setCollabSearch("");
              setCollabDept("");
              setCollabSkill("");
              setCollabStatus("all");
            }}
            className="text-xs text-textMuted hover:text-textPrimary underline ml-auto cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {displayPeople.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
          {displayPeople.map((u: any) => {
            const open = isOpenToWork(u);
            const displayName = u.name || u.email?.split("@")[0] || "Student";
            const initial = (displayName[0] || "?").toUpperCase();
            const projectCount = (u.projects || []).length;
            const collabCount = (u.applications || []).filter((a: any) => a.status === "ACCEPTED").length;
            const lookingForText = u.bio || (u.department ? `${u.department} Projects, AI Hackathons` : "Web & Full Stack Projects");

            return (
              <div
                key={u.id}
                className="card p-5 space-y-4 bg-card rounded-2xl flex flex-col justify-between hover:bg-card-hover transition-all duration-200 shadow-xs group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center font-bold text-lg text-textPrimary shrink-0 overflow-hidden shadow-xs">
                      {u.profileImage ? (
                        <Image src={u.profileImage} alt={displayName} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        initial
                      )}
                    </div>
                    <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${open ? "bg-emerald-500" : "bg-amber-500"}`} />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border ${
                      open
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    }`}>
                      {open ? "Available" : "Busy"}
                    </span>
                    <button className="p-1 text-textMuted hover:text-textPrimary rounded-lg cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/profile/${u.id}`} className="text-[15px] font-bold text-textPrimary hover:underline truncate">
                      {displayName}
                    </Link>
                  </div>
                  <p className="text-xs text-textMuted font-medium">
                    Year {u.year || 2} • {u.department || "CSE"}
                  </p>
                </div>

                {u.skills && u.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {u.skills.slice(0, 3).map((s: any) => (
                      <span
                        key={s.id}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/80 text-textPrimary border border-border/60 hover:bg-card-hover cursor-pointer transition-colors"
                        onClick={() => setCollabSkill(collabSkill === s.name ? "" : s.name)}
                      >
                        {s.name}
                      </span>
                    ))}
                    {u.skills.length > 3 && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-secondary text-textMuted border border-border/60">
                        +{u.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-[11.5px] text-textMuted line-clamp-1">
                  <span className="font-semibold text-textPrimary/80">Looking for: </span>
                  {lookingForText}
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/60 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-textPrimary">
                      <Folder size={11} className="text-textMuted" />
                      {projectCount}
                    </div>
                    <div className="text-[9.5px] text-textMuted font-medium">Projects</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-textPrimary">
                      <Users size={11} className="text-textMuted" />
                      {collabCount}
                    </div>
                    <div className="text-[9.5px] text-textMuted font-medium">Collaborations</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/profile/${u.id}`}
                    className="btn-secondary text-[11.5px] py-2 px-3 justify-center rounded-xl font-semibold border border-border hover:bg-secondary text-center"
                  >
                    View Profile
                  </Link>
                  {u.id !== currentUser?.id && hasProjects && onInviteUser ? (
                    <button
                      type="button"
                      onClick={() => onInviteUser(u)}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] py-2 px-3 justify-center rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send size={12} /> Invite
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyEmail(u.id, u.email ?? "")}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] py-2 px-3 justify-center rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {copiedId === u.id ? <CheckCheck size={12} /> : <Send size={12} />}
                      {copiedId === u.id ? "Copied!" : "Invite"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-14 text-center border border-border bg-card rounded-2xl space-y-2">
          <Users size={32} className="mx-auto text-textMuted/40" />
          <p className="text-base font-bold text-textPrimary">No collaborators found</p>
          <p className="text-xs text-textMuted">Try adjusting your filters or search query.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/80">
          <p className="text-xs text-textMuted font-medium">
            Showing <span className="font-semibold text-textPrimary">{(page - 1) * pageSize + 1}</span>–
            <span className="font-semibold text-textPrimary">{Math.min(page * pageSize, filtered.length)}</span> of{" "}
            <span className="font-semibold text-textPrimary">{filtered.length}</span> collaborators
          </p>

          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              className="p-2 text-textMuted hover:text-textPrimary rounded-lg border border-border bg-card cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => changePage(pNum)}
                className={`min-w-[32px] h-8 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  pNum === page
                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                    : "bg-card text-textMuted hover:text-textPrimary border-border"
                }`}
              >
                {pNum}
              </button>
            ))}

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => changePage(page + 1)}
              className="p-2 text-textMuted hover:text-textPrimary rounded-lg border border-border bg-card cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-textMuted">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setRawPage(1);
              }}
              className="bg-card border border-border rounded-lg text-textPrimary px-3 py-1.5 font-medium appearance-none cursor-pointer"
              style={selectBg}
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>
        </div>
      )}

      {!isDesktop && extraHasMore && page === totalPages && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary text-[12px] py-2 px-6 font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Collaborators"}
          </button>
        </div>
      )}
    </div>
  );
}
