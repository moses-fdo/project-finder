"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, SlidersHorizontal, Loader2, Check } from "lucide-react";

interface ProjectFiltersProps {
  skills: string[];
  departments: string[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "FULL", label: "Full" },
  { value: "CLOSED", label: "Closed" },
];

export default function ProjectFilters({ skills, departments }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

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
  const activeCount = [dept, status, skill].filter(Boolean).length;

  const applyAndClose = () => {
    setSheetOpen(false);
  };

  const selectControl = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[]
  ) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] text-[13px] py-2.5 pl-3.5 pr-10 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary cursor-pointer hover:bg-secondary transition-all forge-select font-medium"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const activePills = (
    <div className="flex flex-wrap gap-2">
      {dept && (
        <button
          onClick={() => { setDept(""); push({ department: "" }); }}
          aria-label={`Remove filter: ${dept}`}
          className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all duration-200 cursor-pointer"
        >
          {dept} <X size={13} strokeWidth={2} />
        </button>
      )}
      {status && (
        <button
          onClick={() => { setStatus(""); push({ status: "" }); }}
          aria-label={`Remove filter: ${status}`}
          className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-semibold px-3 py-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 transition-all duration-200 cursor-pointer"
        >
          {status} <X size={13} strokeWidth={2} />
        </button>
      )}
      {skill && (
        <button
          onClick={() => { setSkill(""); push({ skill: "" }); }}
          aria-label={`Remove filter: ${skill}`}
          className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-semibold px-3 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all duration-200 cursor-pointer"
        >
          {skill} <X size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );

  const rail = (
    <>
      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); push({ search }); }}
        className="space-y-2"
      >
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search
            size={16}
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
            className="forge-input pl-10 min-h-[46px] text-[13px] font-medium rounded-xl"
            aria-label="Search projects"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="space-y-4">
        {selectControl(
          "Department",
          dept,
          (v) => { setDept(v); push({ department: v }); },
          departments.map((d) => ({ value: d, label: d }))
        )}
        {selectControl("Status", status, (v) => { setStatus(v); push({ status: v }); }, STATUS_OPTIONS)}
        {selectControl(
          "Skill",
          skill,
          (v) => { setSkill(v); push({ skill: v }); },
          skills.map((s) => ({ value: s, label: s }))
        )}
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="btn-secondary w-full min-h-[42px] cursor-pointer flex items-center justify-center gap-2 text-[13px] font-medium rounded-xl"
        >
          Clear all filters
        </button>
      )}

      {/* Active pills */}
      {hasFilters && activePills}
    </>
  );

  return (
    <>
      {/* ── Desktop left rail (sticky) ───────────────────── */}
      <aside className="hidden lg:block">
        <div className="lg:sticky lg:top-20 card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} strokeWidth={1.75} className="text-foreground" />
            <span className="text-[13px] font-bold text-foreground">Filters</span>
            {activeCount > 0 && (
              <span className="ml-auto text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                {activeCount}
              </span>
            )}
          </div>
          {rail}
        </div>
      </aside>

      {/* ── Mobile trigger + sheet ───────────────────────── */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full min-h-[48px] btn-secondary cursor-pointer flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          {hasFilters ? `Filters · ${activeCount}` : "Filters"}
          {isPending && <Loader2 size={15} className="animate-spin" />}
        </button>

        {sheetOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filter projects"
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setSheetOpen(false)}
              className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-[2px] cursor-default"
            />

            {/* Bottom sheet */}
            <div className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal size={16} strokeWidth={1.75} />
                  Filters
                </h3>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    aria-label="Close filters"
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="space-y-5">{rail}</div>

              <button
                type="button"
                onClick={applyAndClose}
                className="mt-6 w-full min-h-[48px] btn-primary cursor-pointer flex items-center justify-center gap-2 text-[14px] font-bold rounded-xl"
              >
                <Check size={16} strokeWidth={2.5} />
                Show results
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
