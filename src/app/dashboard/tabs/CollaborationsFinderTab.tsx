"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Mail, ExternalLink, ArrowRight, UserCheck } from "lucide-react";
import { getDeveloperReputation } from "@/lib/reputation/utils";

// ── 1. Clean Data Models & Helper functions ───────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

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
    year: u.year || 2,
    department: u.department || "Computer Science",
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
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Selected user for the preview drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Derive active selected user details
  const activeSelectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return parsedPeople.find(p => p.c.id === selectedUserId) || null;
  }, [selectedUserId, parsedPeople]);

  // Drawer handling
  const openUserDrawer = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  const closeUserDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeUserDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Scope-contained custom styling matching aesthetic requirements */}
      <style>{`
        .collab-page {
          background-color: #0a0a0b;
          min-height: 100vh;
        }
        
        .collab-card {
          background-color: #151517;
          border: 0.5px solid #2a2a2e;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          height: max-content;
          cursor: pointer;
          transition: border-color 180ms ease, background-color 180ms ease;
        }

        .collab-card:hover {
          border-color: #3e3e44;
          background-color: #1b1b1e;
        }

        .sticky-topbar {
          position: sticky;
          top: 0;
          background-color: #0a0a0b;
          z-index: 40;
          padding-bottom: 12px;
          border-bottom: 0.5px solid #2a2a2e;
        }

        /* Skill chips styling */
        .skill-chip {
          font-size: 10px;
          font-weight: 600;
          padding: 2.5px 6.5px;
          border-radius: 6px;
          border: 1px solid transparent;
          transition: filter 150ms ease;
        }

        .skill-chip:hover {
          filter: brightness(1.15);
        }

        /* Drawer Slide & Fade Animation */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 50;
          opacity: 0;
          pointer-events: none;
          transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .drawer-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }

        .drawer-content {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 360px;
          background-color: #151517;
          border-left: 0.5px solid #2a2a2e;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
          z-index: 60;
          transform: translateX(100%);
          transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .drawer-content.active {
          transform: translateX(0);
        }

        /* Violet Accent Rule */
        .accent-btn-primary {
          background-color: #3C3489;
          color: #ffffff;
          transition: background-color 150ms ease;
        }
        .accent-btn-primary:hover {
          background-color: #4a41a3;
        }
      `}</style>

      <div className="collab-page space-y-6 pb-12 animate-in fade-in duration-300">
        
        {/* ── STICKY TOPBAR ─────────────────────────────────── */}
        <div className="sticky-topbar pt-2 space-y-3">
          
          {/* Search Row */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={collabSearch}
              onChange={e => setCollabSearch(e.target.value)}
              placeholder="Search name, roll number, or skill..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#151517] border border-[#2a2a2e] text-[12.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-600 transition-all"
            />
            {collabSearch && (
              <button
                onClick={() => setCollabSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter dropdowns + Active chips row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={collabDept}
                onChange={e => setCollabDept(e.target.value)}
                className="text-[11px] font-bold px-3 py-2 rounded-lg bg-[#151517] border border-[#2a2a2e] text-zinc-300 hover:text-zinc-100 cursor-pointer outline-none transition-all"
              >
                <option value="">All Departments</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={collabStatus}
                onChange={e => setCollabStatus(e.target.value as any)}
                className="text-[11px] font-bold px-3 py-2 rounded-lg bg-[#151517] border border-[#2a2a2e] text-zinc-300 hover:text-zinc-100 cursor-pointer outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="open">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            {/* Active Filter Chips */}
            {(collabSkill || collabDept || collabStatus !== "all") && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Active:</span>
                
                {collabSkill && (
                  <button
                    onClick={() => setCollabSkill("")}
                    className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/30 text-purple-300 font-bold"
                  >
                    Skill: {collabSkill} <X size={10} />
                  </button>
                )}

                {collabDept && (
                  <button
                    onClick={() => setCollabDept("")}
                    className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-bold"
                  >
                    Dept: {collabDept} <X size={10} />
                  </button>
                )}

                {collabStatus !== "all" && (
                  <button
                    onClick={() => setCollabStatus("all")}
                    className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/30 text-emerald-300 font-bold"
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
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold underline px-1 ml-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD GRID ────────────────────────────────────── */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[12px]">
            {sorted.map(({ u, rep, c }) => {
              const skills = u.skills || [];
              const visibleSkills = skills.slice(0, 3);
              const overflowCount = skills.length - 3;

              return (
                <div
                  key={c.id}
                  onClick={() => openUserDrawer(c.id)}
                  className="collab-card"
                >
                  {/* Top: Info Row */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Avatar name={c.name} size={32} imageUrl={c.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[14px] font-medium text-zinc-100 truncate" title={c.name}>
                          {c.name}
                        </h4>
                        {c.rollNumber && (
                          <p className="font-mono text-[11px] text-zinc-500 leading-tight">
                            {c.rollNumber}
                          </p>
                        )}
                        <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate">
                          Year {c.year} · {c.department}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Skills Chips */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
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
                          <span className="text-[9px] text-zinc-500 font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-800/80 rounded-md">
                            +{overflowCount} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Status Dot Row */}
                  <div className="mt-4 pt-2 border-t border-[#2a2a2e]/60 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        c.status === 'available' ? 'bg-emerald-500' : c.status === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'
                      )} />
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
                        {c.status === 'available' ? 'Available' : c.status === 'busy' ? 'Busy' : 'Unavailable'}
                      </span>
                    </div>

                    {rep.githubConnected && rep.score !== null && (
                      <span className="text-[11px] font-bold text-zinc-400">
                        ★ {rep.stars.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-dashed border-[#2a2a2e] bg-[#151517]/30">
            <UserCheck className="mx-auto mb-2 text-zinc-600" size={28} />
            <h4 className="text-[13px] font-bold text-zinc-300">No collaborators found</h4>
            <p className="text-[11px] text-zinc-500 mt-1">Try resetting filters or adjusting search queries.</p>
          </div>
        )}

      </div>

      {/* ── DETAIL DRAWER (SLIDE-OVER) ───────────────────────── */}
      <div
        className={`drawer-overlay ${isDrawerOpen ? "active" : ""}`}
        onClick={closeUserDrawer}
      >
        <div
          className={`drawer-content ${isDrawerOpen ? "active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {activeSelectedUser && (
            <>
              {/* Top sticky actions */}
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2e] shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Collaborator Details
                </span>
                <button
                  onClick={closeUserDrawer}
                  className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main content scroll block */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Header Profile Summary */}
                <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-[#2a2a2e]/60">
                  <Avatar name={activeSelectedUser.c.name} size={48} imageUrl={activeSelectedUser.c.avatarUrl} />
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-zinc-100">
                      {activeSelectedUser.c.name}
                    </h3>
                    <p className="font-mono text-[10.5px] text-zinc-500">
                      {activeSelectedUser.c.rollNumber || "No Roll Number"}
                    </p>
                    <p className="text-[11.5px] text-zinc-400">
                      Year {activeSelectedUser.c.year} · {activeSelectedUser.c.department}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      activeSelectedUser.c.status === 'available' ? 'bg-emerald-500' : activeSelectedUser.c.status === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {activeSelectedUser.c.status === 'available' ? 'Available for projects' : activeSelectedUser.c.status === 'busy' ? 'Busy' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Bio Block */}
                {activeSelectedUser.u.bio && (
                  <div className="space-y-1.5">
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
                      About
                    </span>
                    <p className="text-[12px] text-zinc-300 leading-relaxed italic">
                      &ldquo;{activeSelectedUser.u.bio}&rdquo;
                    </p>
                  </div>
                )}

                {/* Reputation rating */}
                <div className="space-y-1.5">
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
                    Developer Reputation
                  </span>
                  {activeSelectedUser.rep.githubConnected && activeSelectedUser.rep.score !== null ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-logo text-zinc-200 font-extrabold">
                        {activeSelectedUser.rep.score} / 100
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-violet-500/20 bg-violet-500/10 text-violet-400">
                        {activeSelectedUser.rep.tier} Developer (★ {activeSelectedUser.rep.stars.toFixed(1)})
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Reputation: Unrated (GitHub unlinked)
                    </p>
                  )}
                </div>

                {/* Skills Block */}
                {activeSelectedUser.u.skills && activeSelectedUser.u.skills.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
                      Expertise Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSelectedUser.u.skills.map((s: any) => {
                        const sName = typeof s === "string" ? s : s.name;
                        return (
                          <span key={sName} className={`skill-chip ${getSkillColorClass(sName)}`}>
                            {sName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Projects Block */}
                <div className="space-y-2">
                  <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
                    Active Projects
                  </span>
                  {activeSelectedUser.u.projects && activeSelectedUser.u.projects.length > 0 ? (
                    <div className="space-y-2">
                      {activeSelectedUser.u.projects.map((p: any) => (
                        <div key={p.id} className="p-3 bg-[#0a0a0b]/40 border border-[#2a2a2e]/60 rounded-lg flex items-center justify-between">
                          <span className="text-[11.5px] font-semibold text-zinc-300 truncate pr-2">
                            {p.title}
                          </span>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 border border-dashed border-[#2a2a2e] rounded-lg text-center">
                      <p className="text-[11px] text-zinc-500">Not part of any project yet</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Pinned Footer Actions */}
              <div className="p-4 border-t border-[#2a2a2e] bg-[#151517] shrink-0 grid grid-cols-2 gap-2">
                {activeSelectedUser.u.email ? (
                  <a
                    href={`mailto:${activeSelectedUser.u.email}`}
                    className="py-2.5 rounded-lg border border-zinc-700/60 text-[11.5px] font-bold text-center text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail size={12} />
                    <span>Email</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 rounded-lg border border-zinc-800 text-[11.5px] font-bold text-center text-zinc-600 cursor-not-allowed"
                  >
                    No Email
                  </button>
                )}

                <Link
                  href={`/profile/${activeSelectedUser.c.id}`}
                  className="py-2.5 rounded-lg accent-btn-primary text-[11.5px] font-bold text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Full Profile</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
