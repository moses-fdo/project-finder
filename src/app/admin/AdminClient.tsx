"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FolderOpen,
  Send,
  Bell,
  Trash2,
  ExternalLink,
  Search,
  ShieldAlert,
  CheckCircle,
  XCircle,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalApplications: number;
  totalNotifications: number;
}

interface AdminClientProps {
  stats: Stats;
  users: any[];
  projects: any[];
}

export default function AdminClient({ stats, users, projects }: AdminClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab]   = useState<"overview" | "users" | "projects">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [projSearch, setProjSearch] = useState("");
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [feedback,   setFeedback]   = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  /* ── delete user ───────────────────────────────────────── */
  const deleteUser = async (userId: number, name: string) => {
    if (!confirm(`Delete "${name}" and all their data? This cannot be undone.`)) return;
    setLoadingId(`user-${userId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user.");
      showFeedback("ok", `${name} has been removed.`);
      refresh();
    } catch (e: any) {
      showFeedback("err", e.message);
    } finally {
      setLoadingId(null);
    }
  };

  /* ── delete project ────────────────────────────────────── */
  const deleteProject = async (projectId: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoadingId(`proj-${projectId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project.");
      showFeedback("ok", `"${title}" has been deleted.`);
      refresh();
    } catch (e: any) {
      showFeedback("err", e.message);
    } finally {
      setLoadingId(null);
    }
  };

  /* ── filtered lists ────────────────────────────────────── */
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  const filteredProjects = projects.filter((p) => {
    const q = projSearch.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.owner?.name.toLowerCase().includes(q);
  });

  const statCards = [
    { label: "Total users",        value: stats.totalUsers,        icon: Users,      color: "text-blue-500"   },
    { label: "Total projects",      value: stats.totalProjects,      icon: FolderOpen, color: "text-green-500"  },
    { label: "Total applications",  value: stats.totalApplications,  icon: Send,       color: "text-yellow-500" },
    { label: "Notifications sent",  value: stats.totalNotifications, icon: Bell,       color: "text-purple-500" },
  ];

  const tabs = [
    { id: "overview" as const, label: "Overview",  icon: TrendingUp  },
    { id: "users"    as const, label: "Users",     icon: Users       },
    { id: "projects" as const, label: "Projects",  icon: FolderOpen  },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Forge logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mr-4">
            <div className="h-7 w-7 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">Forge</span>
          </Link>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20">
            <ShieldAlert size={13} strokeWidth={1.75} className="text-destructive" />
            <span className="text-[11px] font-semibold text-destructive uppercase tracking-wide">Admin</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 btn-ghost text-[12px] text-muted-foreground"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back to dashboard
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Page title ──────────────────────────────────────── */}
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Admin Console</h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Manage users, projects, and platform health.
          </p>
        </div>

        {/* ── Feedback banner ─────────────────────────────────── */}
        {feedback && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-[12px] border animate-fade-in ${
            feedback.type === "ok"
              ? "bg-success/10 border-success/20 text-green-700 dark:text-green-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}>
            {feedback.type === "ok"
              ? <CheckCircle size={14} strokeWidth={2} />
              : <XCircle    size={14} strokeWidth={2} />}
            {feedback.msg}
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
                activeTab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════ */}
        {/* OVERVIEW ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="card p-5 flex flex-col gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center ${s.color}`}>
                    <s.icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold text-foreground tabular-nums leading-none">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent users */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-foreground">Recent sign-ups</p>
                <button
                  onClick={() => setActiveTab("users")}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  View all →
                </button>
              </div>
              <div className="divide-y divide-border">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[11px] font-semibold text-foreground">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.verified
                        ? <span className="badge badge-green">Verified</span>
                        : <span className="badge badge-red">Unverified</span>}
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent projects */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-foreground">Recent projects</p>
                <button
                  onClick={() => setActiveTab("projects")}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  View all →
                </button>
              </div>
              <div className="divide-y divide-border">
                {projects.slice(0, 5).map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">by {p.owner?.name} · {p._count.applications} application{p._count.applications !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={p.status === "OPEN" ? "badge badge-green" : p.status === "FULL" ? "badge badge-yellow" : "badge badge-gray"}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* USERS ─────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? "s" : ""}
                {userSearch && " matching"}
              </p>

              {/* Search */}
              <div className="relative w-64">
                <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  className="forge-input pl-8 text-[12px]"
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[12px] text-muted-foreground">No users found.</p>
                ) : filteredUsers.map((u) => (
                  <div key={u.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[12px] font-semibold text-foreground">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/profile/${u.id}`}
                            className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2"
                          >
                            {u.name}
                          </Link>
                          {u.role === "ADMIN" && (
                            <span className="badge badge-red">Admin</span>
                          )}
                          {u.verified
                            ? <span className="badge badge-green">Verified</span>
                            : <span className="badge badge-gray">Unverified</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {u.email} · {u.department} · Year {u.year}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {u._count.projects} project{u._count.projects !== 1 ? "s" : ""} · {u._count.applications} application{u._count.applications !== 1 ? "s" : ""}
                          {" · "}Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <Link
                        href={`/profile/${u.id}`}
                        className="btn-ghost text-[12px] p-2"
                        title="View profile"
                        aria-label={`View ${u.name}'s profile`}
                      >
                        <ExternalLink size={13} strokeWidth={1.75} />
                      </Link>
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          disabled={loadingId !== null}
                          className="btn-ghost p-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={`Delete ${u.name}`}
                          aria-label={`Delete ${u.name}`}
                        >
                          {loadingId === `user-${u.id}`
                            ? <span className="text-[11px]">…</span>
                            : <Trash2 size={13} strokeWidth={1.75} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* PROJECTS ──────────────────────────────────────────── */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
                {projSearch && " matching"}
              </p>

              <div className="relative w-64">
                <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="forge-input pl-8 text-[12px]"
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="divide-y divide-border">
                {filteredProjects.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[12px] text-muted-foreground">No projects found.</p>
                ) : filteredProjects.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2"
                        >
                          {p.title}
                        </Link>
                        <span className={
                          p.status === "OPEN" ? "badge badge-green" :
                          p.status === "FULL" ? "badge badge-yellow" :
                          "badge badge-gray"
                        }>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        by{" "}
                        <Link href={`/profile/${p.owner?.id}`} className="hover:underline font-medium text-foreground">
                          {p.owner?.name}
                        </Link>
                        {" · "}{p.owner?.department}
                        {" · "}{p._count.applications} application{p._count.applications !== 1 ? "s" : ""}
                      </p>
                      {p.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.skills.slice(0, 4).map((s: any) => (
                            <span key={s.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                              {s.name}
                            </span>
                          ))}
                          {p.skills.length > 4 && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                              +{p.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <Link
                        href={`/projects/${p.id}`}
                        className="btn-ghost text-[12px] p-2"
                        title="View project"
                        aria-label={`View ${p.title}`}
                      >
                        <ExternalLink size={13} strokeWidth={1.75} />
                      </Link>
                      <button
                        onClick={() => deleteProject(p.id, p.title)}
                        disabled={loadingId !== null}
                        className="btn-ghost p-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title={`Delete ${p.title}`}
                        aria-label={`Delete ${p.title}`}
                      >
                        {loadingId === `proj-${p.id}`
                          ? <span className="text-[11px]">…</span>
                          : <Trash2 size={13} strokeWidth={1.75} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
