"use client";

import { useState, useMemo, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight, UserCheck, Star } from "lucide-react";
import { getDeveloperReputation } from "@/lib/reputation/utils";
import { useRouter } from "next/navigation";

// ── 1. Clean Data Models & Helper functions ───────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Estimated height of a collaborator profile card — used to compute how many
// full rows fit inside the grid area without scrolling.
const PROFILE_CARD_HEIGHT = 200;

interface Collaborator {
  id: string;
  name: string;        // "Christopher Noble E S"
  rollNumber: string;  // "URK24CS7001"
  year: number;
  department: string;
  status: 'available' | 'busy' | 'unavailable';
  avatarUrl?: string;
}

function parseNameAndRollNumber(fullName: string): { name: string; rollNumber: string } {
  if (!fullName) return { name: "", rollNumber: "" };
  const match = fullName.match(/\s+([A-Z]{3}\d{2}[A-Z]{2}\d{4}|\d{2}[A-Z]{3}\d{4}|\d{4,10})$/i);
  if (match) {
    const rollNumber = match[1];
    const name = fullName.substring(0, fullName.lastIndexOf(rollNumber)).trim();
    return { name, rollNumber };
  }
  return { name: fullName.trim(), rollNumber: "" };
}

function mapToCollaborator(u: any): Collaborator {
  const { name, rollNumber } = parseNameAndRollNumber(u.name || u.email?.split("@")[0] || "Student");
  
  let status: 'available' | 'busy' | 'unavailable' = 'available';
  if (u.availability === 'BUSY') {
    status = 'busy';
  } else if (u.availability === 'UNAVAILABLE') {
    status = 'unavailable';
  }
  
  return {
    id: String(u.id),
    name,
    rollNumber,
    year: u.year || undefined,
    department: u.department || undefined,
    status,
    avatarUrl: u.profileImage || undefined,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
}

// Hashed Background Color Palette for Avatars
function getAvatarBgColor(name: string): string {
  const palette = [
    'bg-violet-950/60 text-violet-300 border-violet-800/40',
    'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    'bg-blue-950/60 text-blue-300 border-blue-800/40',
    'bg-orange-950/60 text-orange-300 border-orange-800/40',
    'bg-rose-950/60 text-rose-300 border-rose-800/40',
    'bg-amber-950/60 text-amber-300 border-amber-800/40',
    'bg-teal-950/60 text-teal-300 border-teal-800/40',
    'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
    'bg-purple-950/60 text-purple-300 border-purple-800/40',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

// Categorized color chips: Purple (Frontend), Teal (Design), Coral (Backend/Data)
function getSkillColorClass(skillName: string): string {
  const lower = skillName.toLowerCase();
  // Design (Teal)
  if (lower.match(/design|figma|ui|ux|sketch|photoshop|illustrator|adobe|canvas|creative|art/)) {
    return 'bg-teal-950/70 text-teal-300 border-teal-900/30';
  }
  // Frontend (Purple)
  if (lower.match(/react|next|vue|angular|svelte|html|css|js|ts|javascript|typescript|tailwind|sass|bootstrap|web/)) {
    return 'bg-purple-950/70 text-purple-300 border-purple-900/30';
  }
  // Backend / Data (Coral/Amber)
  return 'bg-[#2e1d17] text-[#fdba74] border-[#4d281a]/40';
}

// ── 2. Component System ──────────────────────────────────────────

function Avatar({ name, size, imageUrl }: { name: string; size: number; imageUrl?: string }) {
  const initials = getInitials(name);
  const colorClass = getAvatarBgColor(name);

  return (
    <div
      className={`rounded-full border flex items-center justify-center overflow-hidden shrink-0 font-bold ${colorClass}`}
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.38}px` }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          className="object-cover h-full w-full"
          unoptimized
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ── 3. Main Container Component ──────────────────────────────────

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
  collabPage?: number;
  collabLimit?: number;
  totalCollabs?: number;
  onInviteUser?: (user: any) => void;
}

export default function CollaborationsFinderTab({
  people: initialPeople,
  currentUser,
  collabSearch, setCollabSearch,
  collabDept,   setCollabDept,
  collabSkill,  setCollabSkill,
  collabStatus, setCollabStatus,
  hasProjects: _hasProjects = false,
  collabPage = 1,
  collabLimit = 24,
  totalCollabs = 0,
  onInviteUser: _onInviteUser,
}: CollaborationsFinderTabProps) {
  
  const router = useRouter();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [layoutHeight, setLayoutHeight] = useState<number>(500);
  const [gridWidth, setGridWidth] = useState<number>(1200);
  const [gridHeight, setGridHeight] = useState<number>(0);

  const [, startTransition] = useTransition();

  const totalPages = Math.ceil((totalCollabs || 0) / (collabLimit || 24));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, collabPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (pageNum: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("collabPage", String(pageNum));
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
      router.refresh();
    });
  };



  // Measure the grid's live dimensions so the card count always matches the
  // visible area (re-measured after any layout change, not just on mount).
  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setGridWidth(width);
        setGridHeight(height);
      }
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  // Keep the collaborator section locked to the visible viewport height.
  useEffect(() => {
    function updateLayoutHeight() {
      const height = window.innerHeight;
      const headerHeight = 56;
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile ? 32 : 56;
      const navHeight = isMobile ? 64 : 0;
      setLayoutHeight(height - headerHeight - padding - navHeight);
    }
    updateLayoutHeight();
    window.addEventListener("resize", updateLayoutHeight);
    return () => window.removeEventListener("resize", updateLayoutHeight);
  }, []);

  // Keep collabLimit in sync with the number of cards that fit on screen
  // (full rows only) — remaining profiles paginated.
  useEffect(() => {
    if (!gridWidth || !gridHeight) return;
    const timer = setTimeout(() => {
      const cols = Math.max(1, Math.floor(gridWidth / 300));
      const GRID_GAP = 12;
      const rows = Math.max(1, Math.floor((gridHeight + GRID_GAP) / (PROFILE_CARD_HEIGHT + GRID_GAP)));
      const targetLimit = cols * rows;
      if (targetLimit > 0 && Math.abs((collabLimit || 24) - targetLimit) >= 1) {
        const params = new URLSearchParams(window.location.search);
        params.set("collabLimit", String(targetLimit));
        params.set("collabPage", "1"); // Reset to page 1
        startTransition(() => {
          router.replace(`/dashboard?${params.toString()}`);
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [gridWidth, gridHeight, collabLimit, router]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Merge + De-duplicate people list
  const allPeople = useMemo(() => {
    const raw = [...initialPeople];
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
  }, [initialPeople, currentUser]);

  // Pre-parse the people database models
  const parsedPeople = useMemo(() => {
    return allPeople.map((u: any) => {
      const rep = getDeveloperReputation(u);
      const collaborator = mapToCollaborator(u);
      return { u, rep, c: collaborator };
    });
  }, [allPeople]);

  const allDepts = useMemo(() =>
    Array.from(new Set(parsedPeople.map(({ c }) => c.department).filter(Boolean))).sort(),
  [parsedPeople]);

  // Filter list
  const filtered = useMemo(() => {
    const q = collabSearch.trim().toLowerCase();
    return parsedPeople.filter(({ u, c }) => {
      if (q && !(c.name || "").toLowerCase().includes(q) &&
               !(c.rollNumber || "").toLowerCase().includes(q) &&
               !(u.email || "").toLowerCase().includes(q) &&
               !(c.department || "").toLowerCase().includes(q) &&
               !(u.bio ?? "").toLowerCase().includes(q) &&
               !(u.skills || []).some((s: any) => (s?.name || "").toLowerCase().includes(q))) return false;
      if (collabDept && c.department !== collabDept) return false;
      if (collabSkill && !((u.skills || []).some((s: any) => s?.name?.toLowerCase() === collabSkill.toLowerCase()))) return false;
      if (collabStatus === "open" && c.status !== 'available') return false;
      if (collabStatus === "busy" &&  c.status !== 'busy') return false;
      return true;
    });
  }, [parsedPeople, collabSearch, collabDept, collabSkill, collabStatus]);

  // Sort list: Available status first, then alphabetical by name
  const sorted = useMemo(() => {
    const withRep = [...filtered];
    return withRep.sort((a, b) => {
      const statusOrder = { available: 0, busy: 1, unavailable: 2 };
      const orderA = statusOrder[a.c.status] ?? 3;
      const orderB = statusOrder[b.c.status] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      return a.c.name.localeCompare(b.c.name);
    });
  }, [filtered]);

  // Calculate the columns dynamically
  const cols = Math.max(1, Math.floor(gridWidth / 300));

  // Number of full rows that fit inside the grid area without scrolling
  const GRID_GAP = 12;
  const availableGridHeight = gridHeight || layoutHeight;
  const rows = Math.max(1, Math.floor((availableGridHeight + GRID_GAP) / (PROFILE_CARD_HEIGHT + GRID_GAP)));
  const cardsPerPage = cols * rows;

  // Render only the profiles that fit on screen — the rest are reached via
  // pagination. Sliced to full rows so the grid stays rectangular (no empty slots).
  const displayPeople = useMemo(() => {
    if (sorted.length === 0) return [];
    const cap = Math.min(sorted.length, cardsPerPage);
    const fullRowsCount = Math.floor(cap / cols) * cols;
    const countToDisplay = fullRowsCount > 0 ? fullRowsCount : cap;
    return sorted.slice(0, countToDisplay);
  }, [sorted, cols, cardsPerPage]);



  return (
    <>
      {/* Scope-contained custom styling matching aesthetic requirements */}
      <style>{`
        .collab-page {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .sticky-topbar {
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }

        /* Skill chips styling */
        .skill-chip {
          font-size: 9px;
          font-weight: 600;
          padding: 1.5px 5.5px;
          border-radius: 6px;
          border: 1px solid transparent;
          transition: filter 150ms ease;
        }

        .skill-chip:hover {
          filter: brightness(1.15);
        }
      `}</style>

      <div className="collab-page space-y-3.5 animate-in fade-in duration-300" style={{ height: `${layoutHeight}px` }}>
        
        {/* Tab Introduction Header */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <h2 className="type-section-title">Find Collaborators</h2>
          <p className="type-meta mt-0.5">
            Connect with peers, discover expertise, and build your project team.
          </p>
        </div>

        {/* ── STICKY TOPBAR ─────────────────────────────────── */}
        <div className="sticky-topbar pt-1 pb-3 space-y-2.5 shrink-0 border-b border-border/30">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input on the Left */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={collabSearch}
                onChange={e => setCollabSearch(e.target.value)}
                placeholder="Search name, roll number, or skill..."
                className="w-full pl-10 pr-9 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/60 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all duration-150"
              />
              {collabSearch && (
                <button
                  onClick={() => setCollabSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Filters on the Right */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={collabDept}
                onChange={e => setCollabDept(e.target.value)}
                className="text-[11.5px] font-semibold px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/60 text-muted-foreground hover:text-foreground cursor-pointer outline-none transition-all duration-150"
              >
                <option value="">All Departments</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={collabStatus}
                onChange={e => setCollabStatus(e.target.value as any)}
                className="text-[11.5px] font-semibold px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/60 text-muted-foreground hover:text-foreground cursor-pointer outline-none transition-all duration-150"
              >
                <option value="all">All Status</option>
                <option value="open">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
          </div>

          {/* Active Chips Row (Only visible when active filters exist) */}
          {(collabSkill || collabDept || collabStatus !== "all") && (
            <div className="flex flex-wrap gap-2 items-center pt-1 animate-in fade-in duration-150">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Filters:</span>
              
              {collabSkill && (
                <button
                  onClick={() => setCollabSkill("")}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 font-semibold hover:bg-purple-500/20 transition-colors cursor-pointer"
                >
                  Skill: {collabSkill} <X size={10} />
                </button>
              )}

              {collabDept && (
                <button
                  onClick={() => setCollabDept("")}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 font-semibold hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  Dept: {collabDept} <X size={10} />
                </button>
              )}

              {collabStatus !== "all" && (
                <button
                  onClick={() => setCollabStatus("all")}
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  Status: {collabStatus === "open" ? "Available" : "Busy"} <X size={10} />
                </button>
              )}

              <button
                onClick={() => {
                  setCollabSkill("");
                  setCollabDept("");
                  setCollabStatus("all");
                  setCollabSearch("");
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold underline px-1 cursor-pointer transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── CARD GRID ────────────────────────────────────── */}
        {displayPeople.length > 0 ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden py-2">
            <div 
              ref={gridRef} 
              className="grid gap-3 auto-rows-auto flex-1 min-h-0 overflow-y-auto pr-1 content-start"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
            {displayPeople.map(({ u, rep, c }) => {
              const skills = u.skills || [];
              const visibleSkills = skills.slice(0, 3);
              const overflowCount = skills.length - 3;
              const projectsCount = (u.projects || []).length;
              const collabCount = (u.applications || []).filter((a: any) => a?.status === "ACCEPTED").length;
              const isRated = rep.githubConnected && rep.score !== null;

              return (
                <div
                  key={c.id}
                  className="card px-4 py-3.5 border border-border/50 bg-gradient-to-br from-card/85 via-card to-secondary/15 shadow-xs transition-none flex flex-col justify-between h-full relative overflow-hidden"
                >
                  {/* Status Badge in Top Right */}
                  <span className={cn(
                    "absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-300 z-10",
                    c.status === 'available'
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                      : c.status === 'busy'
                      ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                      : 'bg-muted/30 text-muted-foreground border-border/40'
                  )}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      c.status === 'available' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : c.status === 'busy' ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-muted-foreground/50',
                      c.status !== 'unavailable' && 'animate-pulse'
                    )} />
                    {c.status === 'available' ? 'Available' : c.status === 'busy' ? 'Busy' : 'Unavailable'}
                  </span>

                  {/* Top: Info Row */}
                  <div className="space-y-2">
                    <Link href={`/profile/${c.id}`} className="flex items-start gap-3 min-w-0 hover:opacity-85 transition-opacity">
                      <Avatar name={c.name} size={40} imageUrl={c.avatarUrl} />
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5 pr-20">
                        <h4 className="text-[13.5px] sm:text-[14px] font-bold text-foreground truncate" title={c.name}>
                          {c.name}
                        </h4>
                        {c.rollNumber ? (
                          <span className="self-start font-mono text-[9px] font-semibold text-muted-foreground bg-secondary/50 border border-border/60 px-1.5 py-0.5 rounded-md leading-none truncate">
                            {c.rollNumber}
                          </span>
                        ) : (
                          <span className="self-start font-mono text-[9px] text-muted-foreground/30 px-1 py-0.5 leading-none select-none">
                            &nbsp;
                          </span>
                        )}
                        <p className="text-[11px] text-muted-foreground truncate leading-normal mt-0.5">
                          Year {c.year} · {c.department}
                        </p>
                      </div>
                    </Link>

                    {/* Middle: Skills Chips */}
                    <div className="flex flex-wrap gap-1 pt-0.5 h-[22px] items-center overflow-hidden">
                      {skills.length > 0 ? (
                        <>
                          {visibleSkills.map((s: any) => {
                            const sName = typeof s === "string" ? s : s.name;
                            return (
                              <button
                                key={sName}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCollabSkill(sName);
                                }}
                                className={`skill-chip ${getSkillColorClass(sName)}`}
                              >
                                {sName}
                              </button>
                            );
                          })}
                          {overflowCount > 0 && (
                            <span className="text-[9px] text-muted-foreground font-bold px-1.5 py-0.5 bg-secondary border border-border rounded-md">
                              +{overflowCount}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/45 italic px-2 py-0.5 bg-secondary/30 border border-border/30 rounded-md">
                          No skills specified
                        </span>
                      )}
                    </div>

                    {/* Stats Dashboard Strip */}
                    <div className="grid grid-cols-3 gap-0 rounded-lg bg-secondary/20 border border-border/40 divide-x divide-border/30 py-1.5 mt-2">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[14.5px] font-black text-foreground leading-none">{projectsCount}</span>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Projects</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[14.5px] font-black text-foreground leading-none">{collabCount}</span>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Collabs</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-0.5">
                          {isRated && <Star size={9} className="fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400 shrink-0" />}
                          <span className={cn(
                            "text-[14.5px] font-black leading-none",
                            isRated ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground/45"
                          )}>
                            {isRated ? rep.stars.toFixed(1) : "—"}
                          </span>
                        </div>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Rating</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: View Profile Button */}
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <Link
                      href={`/profile/${c.id}`}
                      className="w-full py-2 px-3 bg-secondary/60 hover:bg-accent border border-border/60 hover:border-accent text-[11.5px] font-bold text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs"
                    >
                      View Profile <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3.5 border-t border-border/50 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePageChange(collabPage - 1)}
                  disabled={collabPage <= 1}
                  className={cn(
                    "px-3.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                    collabPage > 1
                      ? "bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      : "bg-transparent border-border/30 text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  ← Prev
                </button>
                
                <div className="flex items-center gap-1.5">
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "h-7 w-7 flex items-center justify-center rounded-lg text-[11px] font-bold border transition-all cursor-pointer",
                        pageNum === collabPage
                          ? "bg-accent text-white font-bold border-accent shadow-xs"
                          : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(collabPage + 1)}
                  disabled={collabPage >= totalPages}
                  className={cn(
                    "px-3.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                    collabPage < totalPages
                      ? "bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      : "bg-transparent border-border/30 text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
            <UserCheck className="mx-auto mb-2 text-muted-foreground" size={28} />
            <h4 className="text-[13px] font-bold text-foreground">No collaborators found</h4>
            <p className="text-[11px] text-muted-foreground mt-1">Try resetting filters or adjusting search queries.</p>
          </div>
        )}
      </div>
    </>
  );
}
