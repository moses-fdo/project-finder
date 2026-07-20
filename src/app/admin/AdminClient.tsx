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
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Gift,
  Link2,
  FileSpreadsheet,
  Download,
  Upload,
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
  hackathons?: any[];
}

export default function AdminClient({ stats, users, projects, hackathons = [] }: AdminClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab]   = useState<"overview" | "users" | "projects" | "hackathons">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [projSearch, setProjSearch] = useState("");
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [feedback,   setFeedback]   = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Hackathon form state
  const [showAddHackathon, setShowAddHackathon] = useState(false);
  const [hTitle,       setHTitle]       = useState("");
  const [hDescription, setHDescription] = useState("");
  const [hDate,        setHDate]        = useState("");
  const [hLocation,    setHLocation]    = useState("");
  const [hTeamSize,    setHTeamSize]    = useState("1 - 4 Members");
  const [hPrize,       setHPrize]       = useState("");
  const [hLink,        setHLink]        = useState("");
  const [hSubmitting,  setHSubmitting]  = useState(false);

  // Excel Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile,     setImportFile]     = useState<File | null>(null);
  const [importing,      setImporting]      = useState(false);
  const [importErrors,   setImportErrors]   = useState<string[]>([]);

  const handleExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/admin/hackathons/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) setImportErrors(data.details);
        throw new Error(data.error || "Failed to import Excel sheet.");
      }

      showFeedback("ok", data.message || "Hackathons imported successfully!");
      setShowImportModal(false);
      setImportFile(null);
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Title,Description,Date,Location,Team Size,Prize,Registration Link\n" +
      "\"HackFest 2025\",\"Build innovative solutions for smart campus mobility.\",\"25-26 April 2025\",\"Main Auditorium\",\"3 - 5 Members\",\"₹50,000 Cash Prizes\",\"https://forms.google.com/sample\"\n" +
      "\"AI Health Hackathon\",\"AI & ML healthcare hackathon for students.\",\"10 May 2025\",\"Computer Lab 3\",\"1 - 4 Members\",\"Internship & ₹30,000\",\"https://forms.google.com/sample2\"\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hackathons_sample_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const refresh = () => startTransition(() => router.refresh());

  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const createHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setHSubmitting(true);
    try {
      const res = await fetch("/api/admin/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: hTitle,
          description: hDescription,
          date: hDate,
          location: hLocation,
          teamSize: hTeamSize,
          prize: hPrize,
          link: hLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create hackathon.");
      showFeedback("ok", `Hackathon "${hTitle}" created & broadcasted to all students!`);
      setShowAddHackathon(false);
      setHTitle(""); setHDescription(""); setHDate(""); setHLocation(""); setHPrize(""); setHLink("");
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setHSubmitting(false);
    }
  };

  const deleteHackathon = async (id: number, title: string) => {
    if (!confirm(`Delete hackathon "${title}"?`)) return;
    setLoadingId(`hack-${id}`);
    try {
      const res = await fetch(`/api/admin/hackathons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete hackathon.");
      }
      showFeedback("ok", `Hackathon "${title}" deleted.`);
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setLoadingId(null);
    }
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
    { id: "overview"   as const, label: "Overview",                        icon: TrendingUp },
    { id: "users"      as const, label: `Users (${users.length})`,         icon: Users      },
    { id: "projects"   as const, label: `Projects (${projects.length})`,   icon: FolderOpen },
    { id: "hackathons" as const, label: `Hackathons (${hackathons.length})`, icon: Trophy   },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Colabro logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mr-4">
            <div className="h-7 w-7 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">Colabro</span>
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

        {/* ════════════════════════════════════════════════════ */}
        {/* HACKATHONS ───────────────────────────────────────── */}
        {activeTab === "hackathons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-foreground">Campus Hackathons</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Post and manage upcoming student hackathons &amp; competitions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn-secondary text-[12px] py-2 px-3.5 flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <FileSpreadsheet size={14} className="text-green-500" />
                  Import Excel
                </button>
                <button
                  onClick={() => setShowAddHackathon(true)}
                  className="btn-primary text-[12px] py-2 px-4 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <Plus size={14} />
                  Create Hackathon
                </button>
              </div>
            </div>

            {hackathons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hackathons.map((h) => (
                  <div key={h.id} className="card p-5 space-y-4 flex flex-col justify-between border-border relative">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                            <Trophy size={16} />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-bold text-foreground">{h.title}</h3>
                            <span className="text-[10px] text-muted-foreground font-medium">{h.date}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteHackathon(h.id, h.title)}
                          disabled={loadingId === `hack-${h.id}`}
                          className="btn-ghost p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer rounded-md"
                          title="Delete hackathon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {h.description}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground font-medium pt-2">
                        <span className="flex items-center gap-1">📍 {h.location}</span>
                        <span className="flex items-center gap-1">👥 {h.teamSize}</span>
                        {h.prize && <span className="flex items-center gap-1 text-amber-500 font-semibold">🏆 {h.prize}</span>}
                      </div>
                    </div>

                    {h.link && (
                      <div className="border-t border-border pt-3 mt-2">
                        <a
                          href={h.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Registration Link <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center space-y-2">
                <Trophy size={32} className="mx-auto text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-foreground">No hackathons posted yet</p>
                <p className="text-[12px] text-muted-foreground">Click &ldquo;Create Hackathon&rdquo; to post your first event for students.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── CREATE HACKATHON MODAL ────────────────────────────── */}
      {showAddHackathon && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-[460px] p-6 space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">Create New Hackathon</h3>
                  <p className="text-[11px] text-muted-foreground">Post event &amp; notify all platform students</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddHackathon(false)}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createHackathon} className="space-y-3.5">
              <div>
                <label className="block section-label mb-1">Hackathon Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Impact Hackathon 2025"
                  value={hTitle}
                  onChange={(e) => setHTitle(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div>
                <label className="block section-label mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the challenge, rules, and themes…"
                  value={hDescription}
                  onChange={(e) => setHDescription(e.target.value)}
                  className="forge-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24 May 2025"
                    value={hDate}
                    onChange={(e) => setHDate(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KIDS Auditorium / Online"
                    value={hLocation}
                    onChange={(e) => setHLocation(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Team Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 - 5 Members"
                    value={hTeamSize}
                    onChange={(e) => setHTeamSize(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">Prizes / Perks</label>
                  <input
                    type="text"
                    placeholder="e.g. Cash prize up to ₹50,000"
                    value={hPrize}
                    onChange={(e) => setHPrize(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-1">Registration Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://forms.google.com/..."
                  value={hLink}
                  onChange={(e) => setHLink(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddHackathon(false)}
                  className="btn-secondary text-[12px] py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hSubmitting}
                  className="btn-primary text-[12px] py-2 px-5 cursor-pointer font-bold"
                >
                  {hSubmitting ? "Posting…" : "Post & Broadcast Hackathon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IMPORT EXCEL MODAL ───────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-[480px] p-6 space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">Import Hackathons from Excel</h3>
                  <p className="text-[11px] text-muted-foreground">Upload a .xlsx, .xls, or .csv spreadsheet</p>
                </div>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); setImportErrors([]); }}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="card p-3.5 bg-secondary/40 border-dashed border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                  <Download size={13} className="text-primary" />
                  Need a sample template?
                </span>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Download CSV Template
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your file should contain column headers: <strong className="text-foreground">Title, Description, Date, Location, Team Size, Prize, Registration Link</strong>.
              </p>
            </div>

            {importErrors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-1">
                <p className="text-[12px] font-bold text-destructive">Import Warning / Errors:</p>
                <ul className="text-[11px] text-destructive/90 space-y-0.5 max-h-24 overflow-y-auto list-disc pl-4">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleExcelImport} className="space-y-4">
              <div>
                <label className="block section-label mb-1.5">Select Excel / CSV File</label>
                <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center transition-colors bg-card">
                  <input
                    type="file"
                    required
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <Upload size={24} className="mx-auto text-muted-foreground" />
                    {importFile ? (
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{importFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[13px] font-medium text-foreground">Click or drag Excel file here</p>
                        <p className="text-[11px] text-muted-foreground">Supports .xlsx, .xls, and .csv files</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowImportModal(false); setImportFile(null); setImportErrors([]); }}
                  className="btn-secondary text-[12px] py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="btn-primary text-[12px] py-2 px-5 cursor-pointer font-bold bg-green-600 hover:bg-green-700 text-white"
                >
                  {importing ? "Importing Sheet…" : "Import Hackathons"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
