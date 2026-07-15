"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { FiSearch, FiX } from "react-icons/fi";

interface ProjectFiltersProps {
  skills: string[];
  departments: string[];
}

export default function ProjectFilters({ skills, departments }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [dept, setDept] = useState(searchParams.get("department") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");

  const applyFilters = (updates: { search?: string; department?: string; status?: string; skill?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    const newSearch = updates.search !== undefined ? updates.search : search;
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");

    const newDept = updates.department !== undefined ? updates.department : dept;
    if (newDept) params.set("department", newDept);
    else params.delete("department");

    const newStatus = updates.status !== undefined ? updates.status : status;
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");

    const newSkill = updates.skill !== undefined ? updates.skill : skill;
    if (newSkill) params.set("skill", newSkill);
    else params.delete("skill");

    startTransition(() => {
      router.push(`/projects?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const clearAll = () => {
    setSearch("");
    setDept("");
    setStatus("");
    setSkill("");
    startTransition(() => {
      router.push("/projects");
    });
  };

  const hasActiveFilters = search || dept || status || skill;

  return (
    <div className="glass-panel p-6 rounded-xl border border-border mb-8">
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch className="absolute left-3 top-3.5 text-muted-foreground text-lg" />
          <input
            type="text"
            placeholder="Search project title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          {/* Department */}
          <select
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              applyFilters({ department: e.target.value });
            }}
            className="px-3 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="px-3 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="FULL">Full</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Skill */}
          <select
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              applyFilters({ skill: e.target.value });
            }}
            className="px-3 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All Skills</option>
            {skills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-3 text-sm font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md transition-all cursor-pointer w-full md:w-auto"
          >
            Search
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="p-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border transition-all cursor-pointer"
              title="Clear Filters"
            >
              <FiX className="text-base" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
