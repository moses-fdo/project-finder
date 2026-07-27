"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, SlidersHorizontal, Loader2 } from "lucide-react";

interface ProjectFiltersProps {
  skills: string[];
  departments: string[];
}

export default function ProjectFilters({ skills, departments }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch]   = useState(searchParams.get("search")     || "");
  const [dept,   setDept]     = useState(searchParams.get("department") || "");
  const [status, setStatus]   = useState(searchParams.get("status")     || "");
  const [skill,  setSkill]    = useState(searchParams.get("skill")      || "");

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    const merged: Record<string, string> = {
      search,
      department: dept,
      status,
      skill,
      ...updates,
    };

    Object.keys(merged).forEach((key) => {
      if (merged[key]) params.set(key, merged[key]);
      else params.delete(key);
    });

    startTransition(() => router.push(`/projects?${params.toString()}`));
  };

  const clearAll = () => {
    setSearch(""); setDept(""); setStatus(""); setSkill("");
    startTransition(() => router.push("/projects"));
  };

  const hasFilters = search || dept || status || skill;

  return (
    <div className="mb-8 space-y-3.5">
      {/* Search row */}
      <form
        onSubmit={(e) => { e.preventDefault(); push({ search }); }}
        className="flex gap-2 items-center"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            strokeWidth={1.75}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="forge-input pl-10 min-h-[44px] text-[14px] sm:text-[13px]"
            aria-label="Search projects"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary text-[13px] h-11 min-h-[44px] px-4 shrink-0 cursor-pointer flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Filtering…</span>
            </>
          ) : (
            "Search"
          )}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="btn-ghost h-11 w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
      </form>

      {/* Filter chips row */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground shrink-0 pr-1">
          <SlidersHorizontal size={13} strokeWidth={1.75} />
          Filter:
        </span>

        {/* Department */}
        <select
          value={dept}
          onChange={(e) => { setDept(e.target.value); push({ department: e.target.value }); }}
          className="flex-1 sm:flex-none min-h-[44px] text-[13px] sm:text-[12px] py-2 pl-3 pr-8 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary transition-colors appearance-none"
          aria-label="Filter by department"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); push({ status: e.target.value }); }}
          className="flex-1 sm:flex-none min-h-[44px] text-[13px] sm:text-[12px] py-2 pl-3 pr-8 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary transition-colors appearance-none"
          aria-label="Filter by status"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="FULL">Full</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Skill */}
        <select
          value={skill}
          onChange={(e) => { setSkill(e.target.value); push({ skill: e.target.value }); }}
          className="flex-1 sm:flex-none min-h-[44px] text-[13px] sm:text-[12px] py-2 pl-3 pr-8 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary transition-colors appearance-none"
          aria-label="Filter by skill"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Active filter pills with comfortable touch targets */}
        {dept && (
          <button
            onClick={() => { setDept(""); push({ department: "" }); }}
            aria-label={`Remove filter: ${dept}`}
            className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-medium px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent border border-border transition-colors cursor-pointer"
          >
            {dept} <X size={13} strokeWidth={2} />
          </button>
        )}
        {status && (
          <button
            onClick={() => { setStatus(""); push({ status: "" }); }}
            aria-label={`Remove filter: ${status}`}
            className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-medium px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent border border-border transition-colors cursor-pointer"
          >
            {status} <X size={13} strokeWidth={2} />
          </button>
        )}
        {skill && (
          <button
            onClick={() => { setSkill(""); push({ skill: "" }); }}
            aria-label={`Remove filter: ${skill}`}
            className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-medium px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent border border-border transition-colors cursor-pointer"
          >
            {skill} <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
