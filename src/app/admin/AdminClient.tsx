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
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  FileCheck,
  FileText,
  MessageSquareDiff,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalApplications: number;
  totalNotifications: number;
}

interface AbuseLog {
  id: number;
  userId: number;
  timestamp: string | Date;
  reason: string | null;
  count: number;
  user: { id: number; name: string; email: string; department?: string | null; year?: number | null };
}

interface AdminClientProps {
  stats: Stats;
  users: any[];
  projects: any[];
  events?: any[];
  hackathons?: any[];
  allowedEmails?: any[];
  idVerificationRequests?: any[];
  abuseLogs?: AbuseLog[];
}

export default function AdminClient({
  stats,
  users,
  projects,
  events = [],
  hackathons = [],
  allowedEmails = [],
  idVerificationRequests = [],
  abuseLogs = [],
}: AdminClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const eventsList = events.length > 0 ? events : hackathons;

  const [nowMs] = useState(() => Date.now());
  const [activeTab, setActiveTab]   = useState<"overview" | "users" | "projects" | "events" | "hackathons" | "allowedEmails" | "idVerifications" | "moderation">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [projSearch, setProjSearch] = useState("");
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [feedback,   setFeedback]   = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Allowed Emails state
  const [allowedList, setAllowedList]           = useState<any[]>(allowedEmails || []);
  const [allowedSearch, setAllowedSearch]       = useState("");
  const [showAddAllowedModal, setShowAddAllowedModal] = useState(false);
  const [newEmail, setNewEmail]                 = useState("");
  const [newNote, setNewNote]                   = useState("");
  const [addingEmail, setAddingEmail]           = useState(false);

  // ID Verification requests state
  const [idRequests, setIdRequests]             = useState<any[]>(idVerificationRequests || []);
  const [idSearch, setIdSearch]                 = useState("");
  const [previewIdImage, setPreviewIdImage]     = useState<{ name: string; image: string } | null>(null);

  // Event form state
  const [showAddHackathon, setShowAddHackathon] = useState(false);

  // Abuse moderation state
  const [abuseLogList, setAbuseLogList]         = useState<AbuseLog[]>(abuseLogs || []);
  const [abuseSearch, setAbuseSearch]           = useState("");
  const [hTitle,           setHTitle]           = useState("");
  const [hOrganizer,       setHOrganizer]       = useState("");
  const [hOrganizerType,   setHOrganizerType]   = useState("");
  const [hLocation,        setHLocation]        = useState("");
  const [hCity,            setHCity]            = useState("");
  const [hState,           setHState]           = useState("");
  const [hCountry,         setHCountry]         = useState("");
  const [hMode,            setHMode]            = useState("In-Person");
  const [hRegFee,          setHRegFee]          = useState("Free");
  const [hStartDate,       setHStartDate]       = useState("");
  const [hEndDate,         setHEndDate]         = useState("");
  const [hPrize,           setHPrize]           = useState("");
  const [hLink,            setHLink]            = useState("");
  const [hSource,          setHSource]          = useState("");
  const [hDescription,     setHDescription]     = useState("");
  const [hSubmitting,      setHSubmitting]      = useState(false);

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

      const res = await fetch("/api/admin/events/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) setImportErrors(data.details);
        throw new Error(data.error || "Failed to import sheet.");
      }

      showFeedback("ok", data.message || "Events imported successfully!");
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
      "Name,Organizer,Organizer Type,Location,City,State,Country,Mode,Registration Fee,Start Date,End Date,Prize Pool,Link,Source,Description\n" +
      "\"Hack in GitHub DevDays\",\"Devfolio Partner\",\"Corporate / MNC\",\"Bhilai, Chhattisgarh, India\",\"Bhilai\",\"Chhattisgarh\",\"India\",\"In-Person\",\"Free\",\"2026-04-18 03:30\",\"2026-04-18 03:30\",\"Exclusive Google Gemini Prize Kit: $100\",\"https://hack-in-github-devdays.devfolio.co\",\"Devfolio\",\"12-hour high-energy mini hackathon\"\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "events_sample_template.csv";
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
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: hTitle,
          organizer: hOrganizer,
          organizerType: hOrganizerType,
          location: hLocation,
          city: hCity,
          state: hState,
          country: hCountry,
          mode: hMode,
          registrationFee: hRegFee,
          startDate: hStartDate,
          endDate: hEndDate,
          prize: hPrize,
          link: hLink,
          source: hSource,
          description: hDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event.");
      showFeedback("ok", `Event "${hTitle}" created & broadcasted to all students!`);
      setShowAddHackathon(false);
      setHTitle(""); setHOrganizer(""); setHOrganizerType(""); setHLocation(""); setHCity(""); setHState(""); setHCountry(""); setHStartDate(""); setHEndDate(""); setHPrize(""); setHLink(""); setHSource(""); setHDescription("");
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setHSubmitting(false);
    }
  };

  const deleteHackathon = async (id: number, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    setLoadingId(`hack-${id}`);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete event.");
      }
      showFeedback("ok", `Event "${title}" deleted.`);
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

  const handleAddAllowedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAddingEmail(true);
    try {
      const res = await fetch("/api/admin/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, note: newNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add email.");
      showFeedback("ok", `Added ${newEmail} to allowed emails list!`);
      setShowAddAllowedModal(false);
      setNewEmail("");
      setNewNote("");
      if (data.allowedEmail) {
        setAllowedList(prev => [data.allowedEmail, ...prev]);
      }
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setAddingEmail(false);
    }
  };

  const handleDeleteAllowedEmail = async (id: number, email: string) => {
    if (!confirm(`Remove ${email} from allowed list?`)) return;
    setLoadingId(`allow-${id}`);
    try {
      const res = await fetch(`/api/admin/allowed-emails?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove email.");
      showFeedback("ok", `Removed ${email} from allowed list.`);
      setAllowedList(prev => prev.filter(item => item.id !== id));
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  /* ── ID Verification Approval / Rejection ─────────────────── */
  const handleUpdateIdVerification = async (id: number, status: "APPROVED" | "REJECTED", email: string) => {
    const action = status === "APPROVED" ? "approve" : "reject";
    let adminNote: string | undefined;
    if (status === "REJECTED") {
      const note = prompt(`Enter rejection reason for ${email} (optional):`);
      if (note === null) return;
      adminNote = note;
    }

    setLoadingId(`idverif-${id}`);
    try {
      const res = await fetch("/api/admin/id-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request.`);

      showFeedback("ok", `Student ID for ${email} has been ${status.toLowerCase()}!`);
      setIdRequests(prev => prev.map(item => item.id === id ? { ...item, status, adminNote: adminNote || null } : item));
      if (status === "APPROVED") {
        setAllowedList(prev => [{ id: Date.now(), email, note: "Approved Student ID", addedBy: "Admin", createdAt: new Date() }, ...prev]);
      }
      refresh();
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  /* ── filtered lists ────────────────────────────────────── */
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q)
    );
  });

  const filteredProjects = projects.filter((p) => {
    const q = projSearch.toLowerCase();
    return (
      !q ||
      (p.title || "").toLowerCase().includes(q) ||
      (p.owner?.name || "").toLowerCase().includes(q) ||
      (p.owner?.department || "").toLowerCase().includes(q)
    );
  });

  const filteredAllowed = allowedList.filter((item) => {
    const q = allowedSearch.toLowerCase();
    return (
      !q ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.note || "").toLowerCase().includes(q)
    );
  });

  const filteredIdRequests = idRequests.filter((req) => {
    const q = idSearch.toLowerCase();
    return (
      !q ||
      (req.name || "").toLowerCase().includes(q) ||
      (req.email || "").toLowerCase().includes(q) ||
      (req.collegeName || "").toLowerCase().includes(q)
    );
  });

  const filteredAbuseLogs = abuseLogList.filter((log) => {
    const q = abuseSearch.toLowerCase();
    return (
      !q ||
      (log.user?.name || "").toLowerCase().includes(q) ||
      (log.user?.email || "").toLowerCase().includes(q) ||
      (log.reason || "").toLowerCase().includes(q)
    );
  });

  const handleClearAbuseLog = async (id: number) => {
    if (!confirm("Clear this abuse log entry?")) return;
    setLoadingId(`abuse-${id}`);
    try {
      const res = await fetch(`/api/admin/abuse-logs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear log.");
      showFeedback("ok", "Log entry cleared.");
      setAbuseLogList(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearAllAbuseLogs = async () => {
    if (!confirm("Clear ALL abuse log entries? This cannot be undone.")) return;
    setLoadingId("abuse-all");
    try {
      const res = await fetch("/api/admin/abuse-logs", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear logs.");
      showFeedback("ok", "All abuse logs cleared.");
      setAbuseLogList([]);
    } catch (err: any) {
      showFeedback("err", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const statCards = [
    { label: "Total users",        value: stats.totalUsers,        icon: Users,      color: "text-blue-500"   },
    { label: "Total projects",      value: stats.totalProjects,      icon: FolderOpen, color: "text-green-500"  },
    { label: "Total applications",  value: stats.totalApplications,  icon: Send,       color: "text-yellow-500" },
    { label: "Notifications sent",  value: stats.totalNotifications, icon: Bell,       color: "text-purple-500" },
  ];

  const pendingIdCount = idRequests.filter(r => r.status === "PENDING").length;

  const tabs = [
    { id: "overview"        as const, label: "Overview",                        icon: TrendingUp },
    { id: "users"           as const, label: `Users (${users.length})`,         icon: Users      },
    { id: "events"          as const, label: `Events (${eventsList.length})`, icon: Trophy },
    { id: "allowedEmails"   as const, label: `Allowed Emails (${allowedList.length})`, icon: ShieldCheck },
    { id: "idVerifications" as const, label: `ID Verifications (${pendingIdCount > 0 ? `${pendingIdCount} Pending` : idRequests.length})`, icon: FileCheck },
    { id: "moderation"      as const, label: `Moderation (${abuseLogList.length})`, icon: MessageSquareDiff },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Colabro logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mr-2 sm:mr-4 shrink-0">
            <div className="h-7 w-7 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">Colabro</span>
          </Link>

          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-destructive/10 border border-destructive/20 shrink-0">
            <ShieldAlert size={13} strokeWidth={1.75} className="text-destructive shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-destructive uppercase tracking-wide">Admin</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 btn-ghost text-[12px] text-muted-foreground shrink-0 px-2.5 sm:px-3 py-1.5"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          <span className="hidden sm:inline">Back to dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Page title ──────────────────────────────────────── */}
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground">Admin Console</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5 sm:mt-1">
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

        {/* ── Tabs (Mobile Scrollable) ───────────────────────── */}
        <div className="border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap pb-px">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 text-[12px] sm:text-[13px] font-medium border-b-2 transition-colors cursor-pointer shrink-0 -mb-px ${
                  activeTab === t.id
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={14} strokeWidth={1.75} className="shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════ */}
        {/* OVERVIEW ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="card p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center ${s.color}`}>
                    <s.icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[20px] sm:text-[24px] font-bold text-foreground tabular-nums leading-none">{s.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent users */}
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
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
                  <div key={u.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[11px] font-semibold text-foreground">
                        {((u?.name || "U").trim()[0] || "U").toUpperCase()}
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
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
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
                  <div key={p.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">by {p.owner?.name} · {p._count.applications} application{p._count.applications !== 1 ? "s" : ""}</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? "s" : ""}
                {userSearch && " matching"}
              </p>

              {/* Search */}
              <div className="relative w-full sm:w-64">
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
                  <div key={u.id} className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[12px] font-semibold text-foreground">
                        {((u?.name || "U").trim()[0] || "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/profile/${u.id}`}
                            className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2 truncate"
                          >
                            {u.name}
                          </Link>
                          {u.role === "ADMIN" && (
                            <span className="badge badge-red shrink-0">Admin</span>
                          )}
                          {u.verified
                            ? <span className="badge badge-green shrink-0">Verified</span>
                            : <span className="badge badge-gray shrink-0">Unverified</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {u.email} · {u.department} · Year {u.year}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {u._count.projects} project{u._count.projects !== 1 ? "s" : ""} · {u._count.applications} application{u._count.applications !== 1 ? "s" : ""}
                          {" · "}Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t border-border/40 sm:border-0 w-full sm:w-auto justify-end">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
                {projSearch && " matching"}
              </p>

              <div className="relative w-full sm:w-64">
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
                  <div key={p.id} className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2 truncate"
                        >
                          {p.title}
                        </Link>
                        <span className={
                          p.status === "OPEN" ? "badge badge-green shrink-0" :
                          p.status === "FULL" ? "badge badge-yellow shrink-0" :
                          "badge badge-gray shrink-0"
                        }>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
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

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t border-border/40 sm:border-0 w-full sm:w-auto justify-end">
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
        {/* EVENTS / HACKATHONS ──────────────────────────────── */}
        {(activeTab === "events" || activeTab === "hackathons") && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-foreground">Campus Events &amp; Competitions</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Post and manage upcoming student hackathons, competitions, and events.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="btn-secondary text-[12px] py-2 px-3 sm:px-3.5 flex-1 sm:flex-none justify-center items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <FileSpreadsheet size={14} className="text-green-500 shrink-0" />
                  <span className="truncate">Import CSV / Excel</span>
                </button>
                <button
                  onClick={() => setShowAddHackathon(true)}
                  className="btn-primary text-[12px] py-2 px-3.5 sm:px-4 flex-1 sm:flex-none justify-center items-center gap-1.5 cursor-pointer font-bold"
                >
                  <Plus size={14} className="shrink-0" />
                  <span className="truncate">Create Event</span>
                </button>
              </div>
            </div>

            {eventsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsList.map((h: any) => {
                  const locationStr = [h.location, h.city, h.state, h.country].filter(Boolean).join(", ") || h.location || "Online";
                  const isEnded = h.endDate ? new Date(h.endDate).getTime() < nowMs : false;

                  return (
                    <div key={h.id} className="card p-4 sm:p-5 space-y-4 flex flex-col justify-between border-border relative">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                              <Trophy size={18} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-[14px] font-bold text-foreground truncate">{h.title}</h3>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {h.organizer && (
                                  <span className="text-[11px] font-semibold text-foreground/80 truncate">{h.organizer}</span>
                                )}
                                {h.organizerType && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium shrink-0">
                                    {h.organizerType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isEnded ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                Ended
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Active
                              </span>
                            )}
                            <button
                              onClick={() => deleteHackathon(h.id, h.title)}
                              disabled={loadingId === `hack-${h.id}`}
                              className="btn-ghost p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer rounded-md ml-1"
                              title="Delete event"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                          {h.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                          <div>
                            <span className="text-foreground font-semibold">📅 Dates:</span> {h.startDate ? `${h.startDate}${h.endDate ? ` to ${h.endDate}` : ""}` : (h.date || "TBA")}
                          </div>
                          <div>
                            <span className="text-foreground font-semibold">📍 Location:</span> {locationStr}
                          </div>
                          {h.mode && (
                            <div>
                              <span className="text-foreground font-semibold">🌐 Mode:</span> {h.mode}
                            </div>
                          )}
                          {h.registrationFee && (
                            <div>
                              <span className="text-foreground font-semibold">💳 Fee:</span> {h.registrationFee}
                            </div>
                          )}
                          {h.prize && (
                            <div className="col-span-1 sm:col-span-2 text-amber-500 font-semibold line-clamp-1">
                              🏆 Prize: {h.prize}
                            </div>
                          )}
                          {h.source && (
                            <div className="col-span-1 sm:col-span-2 text-[10px] text-muted-foreground">
                              Source: {h.source}
                            </div>
                          )}
                        </div>
                      </div>

                      {h.link && (
                        <div className="border-t border-border pt-3 mt-2 flex items-center justify-between">
                          <a
                            href={h.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Visit Registration Link <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-8 sm:p-12 text-center space-y-2">
                <Trophy size={32} className="mx-auto text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-foreground">No events posted yet</p>
                <p className="text-[12px] text-muted-foreground">Click &ldquo;Create Event&rdquo; or &ldquo;Import CSV / Excel&rdquo; to add events.</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* ALLOWED EMAILS ────────────────────────────────────── */}
        {activeTab === "allowedEmails" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-foreground">Non-College Allowed Emails</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Whitelist non-college email addresses (Gmail, Yahoo, external mentors) so they can register and log in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAllowedModal(true)}
                className="btn-primary text-[12px] py-2 px-4 flex items-center justify-center gap-1.5 cursor-pointer font-bold shrink-0 w-full sm:w-auto"
              >
                <Plus size={14} /> Add Non-College Email
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredAllowed.length}</span> whitelisted email{filteredAllowed.length !== 1 ? "s" : ""}
              </p>
              <div className="relative w-full sm:w-64">
                <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={allowedSearch}
                  onChange={(e) => setAllowedSearch(e.target.value)}
                  placeholder="Search allowed emails…"
                  className="forge-input pl-8 text-[12px]"
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="divide-y divide-border">
                {filteredAllowed.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[12px] text-muted-foreground">No allowed emails added yet.</p>
                ) : filteredAllowed.map((item) => (
                  <div key={item.id} className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground truncate">{item.email}</span>
                        <span className="badge badge-green flex items-center gap-1 shrink-0">
                          <ShieldCheck size={10} /> Whitelisted
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {item.note ? `Note: ${item.note} · ` : ""}Added by {item.addedBy || "Admin"} on {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAllowedEmail(item.id, item.email)}
                      disabled={loadingId === `allow-${item.id}`}
                      className="btn-ghost p-2 text-destructive hover:bg-destructive/10 cursor-pointer self-end sm:self-center"
                      title={`Remove ${item.email}`}
                    >
                      {loadingId === `allow-${item.id}` ? "…" : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* ID VERIFICATIONS ─────────────────────────────────── */}
        {activeTab === "idVerifications" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-foreground">Student ID Verification Requests</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Review student ID cards uploaded by students without institutional .edu emails.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredIdRequests.length}</span> request{filteredIdRequests.length !== 1 ? "s" : ""}
              </p>
              <div className="relative w-full sm:w-64">
                <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={idSearch}
                  onChange={(e) => setIdSearch(e.target.value)}
                  placeholder="Search student, email, college…"
                  className="forge-input pl-8 text-[12px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIdRequests.length === 0 ? (
                <div className="col-span-full card p-8 sm:p-10 text-center text-[12px] text-muted-foreground">
                  No ID verification requests found.
                </div>
              ) : (
                filteredIdRequests.map((req) => (
                  <div key={req.id} className="card p-4 sm:p-5 space-y-4 flex flex-col justify-between border-border">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14px] font-bold text-foreground truncate">{req.name}</h3>
                            <span
                              className={`badge shrink-0 ${
                                req.status === "PENDING"
                                  ? "badge-yellow"
                                  : req.status === "APPROVED"
                                  ? "badge-green"
                                  : "badge-red"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground truncate">{req.email}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="p-3 bg-secondary/50 rounded-lg text-[11px] space-y-1">
                        <p className="text-foreground font-medium truncate">🏫 {req.collegeName}</p>
                        {req.department && <p className="text-muted-foreground truncate">📚 {req.department}</p>}
                        {req.adminNote && <p className="text-destructive font-mono mt-1">Note: {req.adminNote}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setPreviewIdImage({ name: req.name, image: req.idCardImage })}
                        className="btn-secondary text-[11px] py-1.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={12} /> View Student ID Card
                      </button>

                      {req.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateIdVerification(req.id, "REJECTED", req.email)}
                            disabled={loadingId === `idverif-${req.id}`}
                            className="btn-ghost text-[11px] py-1.5 px-3 text-destructive hover:bg-destructive/10 cursor-pointer flex-1 sm:flex-none"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateIdVerification(req.id, "APPROVED", req.email)}
                            disabled={loadingId === `idverif-${req.id}`}
                            className="btn-primary text-[11px] py-1.5 px-3 font-bold bg-green-600 hover:bg-green-700 text-white cursor-pointer flex-1 sm:flex-none"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* MODERATION ─────────────────────────────────────── */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-bold text-foreground">Content Moderation</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Review flagged and blocked project description attempts across the platform.
                </p>
              </div>
              {abuseLogList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllAbuseLogs}
                  disabled={loadingId === "abuse-all"}
                  className="btn-ghost text-[12px] py-2 px-3.5 flex items-center justify-center gap-1.5 cursor-pointer text-destructive hover:bg-destructive/10 border border-destructive/30 rounded-lg shrink-0 w-full sm:w-auto"
                >
                  <Trash2 size={13} />
                  {loadingId === "abuse-all" ? "Clearing…" : "Clear All Logs"}
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredAbuseLogs.length}</span> log entr{filteredAbuseLogs.length !== 1 ? "ies" : "y"}
                {abuseSearch && " matching"}
              </p>
              <div className="relative w-full sm:w-64">
                <Search size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={abuseSearch}
                  onChange={(e) => setAbuseSearch(e.target.value)}
                  placeholder="Search user, email, reason…"
                  className="forge-input pl-8 text-[12px]"
                />
              </div>
            </div>

            {filteredAbuseLogs.length === 0 ? (
              <div className="card p-8 sm:p-12 text-center space-y-2">
                <MessageSquareDiff size={32} className="mx-auto text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-foreground">No flagged descriptions</p>
                <p className="text-[12px] text-muted-foreground">The abuse classifier hasn&apos;t blocked any project descriptions yet.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredAbuseLogs.map((log) => {
                    const flaggedWords = log.reason
                      ? log.reason.replace(/^flagged:/, "").split(",").filter(Boolean)
                      : [];
                    const isPhrase = log.reason === "abusive_phrase" || (!log.reason?.startsWith("flagged:") && log.reason);
                    return (
                      <div key={log.id} className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 text-[12px] font-semibold text-destructive">
                            {((log.user?.name || "U").trim()[0] || "U").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/profile/${log.user.id}`}
                                className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2 truncate"
                              >
                                {log.user.name}
                              </Link>
                              <span className="badge badge-red flex items-center gap-1 shrink-0">
                                <ShieldAlert size={9} />
                                {log.count} blocked attempt{log.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {log.user.email}{log.user.department ? ` · ${log.user.department}` : ""}{log.user.year ? ` · Year ${log.user.year}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {flaggedWords.length > 0
                                ? flaggedWords.map((w, i) => (
                                    <span key={i} className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                      {w}
                                    </span>
                                  ))
                                : isPhrase && (
                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                      abusive phrase
                                    </span>
                                  )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              Last flagged {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t border-border/40 sm:border-0 w-full sm:w-auto justify-end">
                          <Link
                            href={`/profile/${log.user.id}`}
                            className="btn-ghost text-[12px] p-2"
                            title="View profile"
                          >
                            <ExternalLink size={13} strokeWidth={1.75} />
                          </Link>
                          <button
                            onClick={() => handleClearAbuseLog(log.id)}
                            disabled={loadingId !== null}
                            className="btn-ghost p-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Clear this log entry"
                          >
                            {loadingId === `abuse-${log.id}`
                              ? <span className="text-[11px]">…</span>
                              : <Trash2 size={13} strokeWidth={1.75} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── CREATE HACKATHON MODAL ────────────────────────────── */}
      {showAddHackathon && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card w-full max-w-[480px] p-5 sm:p-6 space-y-4 sm:space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                  <Trophy size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground truncate">Create New Hackathon</h3>
                  <p className="text-[11px] text-muted-foreground truncate">Post event &amp; notify all platform students</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddHackathon(false)}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createHackathon} className="space-y-3.5">
              <div>
                <label className="block section-label mb-1">Event Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hack in GitHub DevDays"
                  value={hTitle}
                  onChange={(e) => setHTitle(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. Devfolio Partner / Amazon"
                    value={hOrganizer}
                    onChange={(e) => setHOrganizer(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">Organizer Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate / MNC, University"
                    value={hOrganizerType}
                    onChange={(e) => setHOrganizerType(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, challenge, and goals…"
                  value={hDescription}
                  onChange={(e) => setHDescription(e.target.value)}
                  className="forge-input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Start Date</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD HH:MM (e.g. 2026-04-18 03:30)"
                    value={hStartDate}
                    onChange={(e) => setHStartDate(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">End Date</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD HH:MM (e.g. 2026-04-18 03:30)"
                    value={hEndDate}
                    onChange={(e) => setHEndDate(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Mode</label>
                  <select
                    value={hMode}
                    onChange={(e) => setHMode(e.target.value)}
                    className="forge-input"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block section-label mb-1">Registration Fee</label>
                  <input
                    type="text"
                    placeholder="Free / Paid"
                    value={hRegFee}
                    onChange={(e) => setHRegFee(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block section-label mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={hCity}
                    onChange={(e) => setHCity(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamil Nadu"
                    value={hState}
                    onChange={(e) => setHState(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={hCountry}
                    onChange={(e) => setHCountry(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-1">Full Location String</label>
                <input
                  type="text"
                  placeholder="e.g. Bhilai, Chhattisgarh, India"
                  value={hLocation}
                  onChange={(e) => setHLocation(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block section-label mb-1">Prize Pool</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / $1000"
                    value={hPrize}
                    onChange={(e) => setHPrize(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1">Source / Platform</label>
                  <input
                    type="text"
                    placeholder="Devfolio / Unstop"
                    value={hSource}
                    onChange={(e) => setHSource(e.target.value)}
                    className="forge-input"
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-1">Registration Link</label>
                <input
                  type="url"
                  placeholder="https://..."
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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card w-full max-w-[480px] p-5 sm:p-6 space-y-4 sm:space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground truncate">Import Hackathons from Excel</h3>
                  <p className="text-[11px] text-muted-foreground truncate">Upload a .xlsx, .xls, or .csv spreadsheet</p>
                </div>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); setImportErrors([]); }}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <div className="card p-3.5 bg-secondary/40 border-dashed border-border space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
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
                <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-5 sm:p-6 text-center transition-colors bg-card">
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
                        <p className="text-[13px] font-bold text-foreground truncate">{importFile.name}</p>
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

      {/* ── ADD ALLOWED EMAIL MODAL ─────────────────────────── */}
      {showAddAllowedModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card w-full max-w-[440px] p-5 sm:p-6 space-y-4 sm:space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground truncate">Whitelist Non-College Email</h3>
                  <p className="text-[11px] text-muted-foreground truncate">Grant platform sign-in access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAllowedModal(false)}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAllowedEmail} className="space-y-4">
              <div>
                <label className="block section-label mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mentor.john@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="forge-input"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Users with this email address will be allowed to sign up and log in via Google or email/password.
                </p>
              </div>

              <div>
                <label className="block section-label mb-1">Note / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. External Mentor, Industry Partner, Guest Dev"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddAllowedModal(false)}
                  className="btn-secondary text-[12px] py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEmail || !newEmail.trim()}
                  className="btn-primary text-[12px] py-2 px-5 cursor-pointer font-bold"
                >
                  {addingEmail ? "Adding…" : "Add Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PREVIEW STUDENT ID CARD MODAL ─────────────────── */}
      {previewIdImage && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card w-full max-w-[600px] p-4 sm:p-6 space-y-4 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="min-w-0">
                <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground truncate">Student ID Card</h3>
                <p className="text-[11px] text-muted-foreground truncate">{previewIdImage.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewIdImage(null)}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <div className="p-2 bg-secondary/30 rounded-xl overflow-hidden text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewIdImage.image}
                alt={`Student ID of ${previewIdImage.name}`}
                className="max-h-[350px] sm:max-h-[450px] mx-auto rounded-lg object-contain shadow-md"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewIdImage(null)}
                className="btn-secondary text-[12px] py-1.5 px-4 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
