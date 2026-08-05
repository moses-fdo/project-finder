"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
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

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [dept, setDept] = useState(searchParams.get("department") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sheetOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Focus the sheet dialog on open
    sheetRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sheetOpen]);

  const handleCloseSheet = () => {
    setSheetOpen(false);
    triggerRef.current?.focus();
  };

  const push = (nextParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    const merged = {
      search,
      department: dept,
      status,
      skill,
      ...nextParams,
    };

    Object.entries(merged).forEach(([k, v]) => {
      if (v) current.set(k, v);
      else current.delete(k);
    });

    const queryString = current.toString();
    startTransition(() => {
      router.push(queryString ? `/projects?${queryString}` : "/projects");
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    push({ search });
  };

  const clearAll = () => {
    setSearch("");
    setDept("");
    setStatus("");
    setSkill("");
    startTransition(() => router.push("/projects"));
  };

  const hasFilters = search || dept || status || skill;
  const activeCount = [dept, status, skill].filter(Boolean).length;

  const applyAndClose = () => {
    handleCloseSheet();
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
          <span>Department: {dept}</span>
          <X size={13} strokeWidth={2.2} />
        </button>
      )}
      {status && (
        <button
          onClick={() => { setStatus(""); push({ status: "" }); }}
          aria-label={`Remove filter: ${status}`}
          className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all duration-200 cursor-pointer"
        >
          <span>Status: {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}</span>
          <X size={13} strokeWidth={2.2} />
        </button>
      )}
      {skill && (
        <button
          onClick={() => { setSkill(""); push({ skill: "" }); }}
          aria-label={`Remove filter: ${skill}`}
          className="flex items-center gap-1.5 min-h-[36px] text-[12px] font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all duration-200 cursor-pointer"
        >
          <span>Skill: {skill}</span>
          <X size={13} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );

  const rail = (
    <>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          <Search size={16} strokeWidth={1.75} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, tech..."
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
          [{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]
        )}
        {selectControl("Status", status, (v) => { setStatus(v); push({ status: v }); }, STATUS_OPTIONS)}
        {selectControl(
          "Skill",
          skill,
          (v) => { setSkill(v); push({ skill: v }); },
          [{ value: "", label: "All skills" }, ...skills.map((s) => ({ value: s, label: s }))]
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
    </>
  );

  return (
    <>
      {/* Active pills */}
      {hasFilters && (
        <div className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-xs flex-wrap mb-6">
          {activePills}
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Desktop sidebar rail */}
      <aside className="hidden lg:block space-y-6">
        {rail}
      </aside>

      {/* Mobile trigger + Bottom sheet */}
      <div className="lg:hidden">
        <button
          ref={triggerRef}
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
            ref={sheetRef}
            tabIndex={-1}
            className="fixed inset-0 z-50 lg:hidden focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Filter projects"
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close filters"
              onClick={handleCloseSheet}
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
                    onClick={handleCloseSheet}
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
