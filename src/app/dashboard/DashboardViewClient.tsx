"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import OnboardingModal from "@/components/OnboardingModal";
import EditProjectModal from "@/components/EditProjectModal";
import { getNotificationLink } from "@/lib/notifications";
import {
  Check,
  X,
  Trash2,
  GitBranch,
  Link2,
  Sprout,
  Brain,
  Dumbbell,
  Folder,
  Bookmark,
  Users,
  Trophy,
  Plus,
  Search,
  Copy,
  CheckCheck,
  Mail,
  Send,
  UserPlus,
  LucideIcon,
  Pencil
} from "lucide-react";

interface DashboardViewClientProps {
  activeTab: string;
  currentUser: any;
  projects: any[];
  applications: any[];
  notifications: any[];
  profileData: any;
  collaborations?: any[];
  bookmarks?: any[];
  hackathons?: any[];
  recommendedProjects?: any[];
  receivedInvitations?: any[];
  sentInvitations?: any[];
  myProjectsSidebar?: any[];
  myApplicationsSidebar?: any[];
  myBookmarksSidebar?: any[];
  recentNotifications?: any[];
}

function getProjectIcon(title: string): { icon: LucideIcon; bg: string; text: string } {
  const t = title.toLowerCase();
  if (
    t.includes("eco") ||
    t.includes("track") ||
    t.includes("waste") ||
    t.includes("green") ||
    t.includes("environ")
  ) {
    return { icon: Sprout, bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" };
  }
  if (
    t.includes("study") ||
    t.includes("buddy") ||
    t.includes("learn") ||
    t.includes("book") ||
    t.includes("ai") ||
    t.includes("companion")
  ) {
    return { icon: Brain, bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
  }
  if (
    t.includes("fit") ||
    t.includes("forge") ||
    t.includes("gym") ||
    t.includes("health") ||
    t.includes("workout")
  ) {
    return { icon: Dumbbell, bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" };
  }
  return { icon: Folder, bg: "bg-secondary", text: "text-foreground" };
}

export default function DashboardViewClient({
  activeTab,
  currentUser,
  projects: initialProjects,
  applications,
  notifications,
  profileData,
  collaborations = [],
  bookmarks = [],
  hackathons = [],
  recommendedProjects = [],
  receivedInvitations = [],
  sentInvitations = [],
  myProjectsSidebar = [],
  myApplicationsSidebar = [],
  myBookmarksSidebar = [],
  recentNotifications = [],
}: DashboardViewClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [projects, setProjects] = useState(initialProjects);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Derive currentTab directly from prop — no effect needed
  const currentTab = activeTab || "home";

  const [profileName,     setProfileName]     = useState(profileData?.name         || "");
  const [profileDept,     setProfileDept]     = useState(profileData?.department   || "");
  const [profileYear,     setProfileYear]     = useState(profileData?.year?.toString() || "");
  const [profileBio,      setProfileBio]      = useState(profileData?.bio          || "");
  const [profileGithub,   setProfileGithub]   = useState(profileData?.githubUrl    || "");
  const [profileLinkedin, setProfileLinkedin] = useState(profileData?.linkedinUrl  || "");
  const [profileSkills,   setProfileSkills]   = useState(
    profileData?.skills?.map((s: any) => s.name).join(", ") || ""
  );

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(
    () => new Set(bookmarks.map((bm: any) => bm.project?.id ?? bm.projectId))
  );

  const toggleBookmark = async (projectId: number) => {
    const isBookmarked = bookmarkedIds.has(projectId);
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (isBookmarked) { next.delete(projectId); } else { next.add(projectId); }
      return next;
    });
    try {
      await fetch(`/api/projects/${projectId}/bookmark`, {
        method: isBookmarked ? "DELETE" : "POST",
      });
    } catch { /* silent */ }
  };

  const [collabSearch,  setCollabSearch]  = useState("");
  const [collabDept,    setCollabDept]    = useState("");
  const [collabSkill,   setCollabSkill]   = useState("");
  const [collabStatus,  setCollabStatus]  = useState<"all" | "open" | "busy">("all");
  const [actionError,   setActionError]   = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loadingId,     setLoadingId]     = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Invitations state
  const [receivedNotifs, setReceivedNotifs] = useState<any[]>(receivedInvitations || []);
  const [sentNotifs,     setSentNotifs]     = useState<any[]>(sentInvitations || []);
  const [invitationSubTab, setInvitationSubTab] = useState<"received" | "sent">("received");
  const [inviteModalOpen,  setInviteModalOpen]   = useState(false);
  const [inviteTargetUser, setInviteTargetUser] = useState<any | null>(null);
  const [inviteProjectId,  setInviteProjectId]  = useState<string>("");
  const [inviteMessage,    setInviteMessage]    = useState("");
  const [inviteRole,       setInviteRole]       = useState("");
  const [inviteSending,    setInviteSending]    = useState(false);

  const refresh = () => startTransition(() => router.refresh());

  const handleRespondInvitation = async (invId: number, status: "ACCEPTED" | "DECLINED") => {
    setActionError(""); setActionSuccess(""); setLoadingId(`inv-${invId}`);
    try {
      const res = await fetch(`/api/invitations/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update invitation.");
      setActionSuccess(`Invitation ${status.toLowerCase()}!`);
      setReceivedNotifs(prev => prev.map(inv => inv.id === invId ? { ...inv, status } : inv));
      refresh();
    } catch (e: any) {
      setActionError(e.message || "Failed to update invitation.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelInvitation = async (invId: number) => {
    if (!confirm("Cancel this invitation?")) return;
    setActionError(""); setActionSuccess(""); setLoadingId(`del-inv-${invId}`);
    try {
      const res = await fetch(`/api/invitations/${invId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel invitation.");
      setActionSuccess("Invitation cancelled.");
      setSentNotifs(prev => prev.filter(inv => inv.id !== invId));
      refresh();
    } catch (e: any) {
      setActionError(e.message || "Failed to cancel invitation.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteProjectId || !inviteTargetUser) return;
    setActionError(""); setActionSuccess(""); setInviteSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(inviteProjectId),
          receiverId: Number(inviteTargetUser.id),
          message: inviteMessage,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation.");
      setActionSuccess(`Invitation sent to ${inviteTargetUser.name}!`);
      setInviteModalOpen(false);
      setInviteTargetUser(null);
      setInviteMessage("");
      setInviteRole("");
      setInviteProjectId("");
      if (data.invitation) {
        setSentNotifs(prev => [data.invitation, ...prev]);
      }
      refresh();
    } catch (e: any) {
      setActionError(e.message || "Failed to send invitation.");
    } finally {
      setInviteSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setActionError("");
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete account.");
      }
      await signOut({ callbackUrl: "/login" });
    } catch (err: any) {
      setActionError(err.message || "Failed to delete account.");
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────── */

  const statusToggle = async (projectId: number, current: string) => {
    setActionError(""); setActionSuccess("");
    const next = current === "OPEN" ? "CLOSED" : "OPEN";
    setLoadingId(`status-${projectId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setActionSuccess(`Status set to ${next}.`);
      refresh();
    } catch (e: any) { setActionError(e.message); }
    finally { setLoadingId(null); }
  };

  const deleteProject = async (projectId: number) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setActionError(""); setActionSuccess(""); setLoadingId(`del-${projectId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setActionSuccess("Project deleted.");
      refresh();
    } catch (e: any) { setActionError(e.message); }
    finally { setLoadingId(null); }
  };

  const applicationAction = async (appId: number, status: "ACCEPTED" | "REJECTED") => {
    setActionError(""); setActionSuccess(""); setLoadingId(`app-${appId}`);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setActionSuccess(`Application ${status.toLowerCase()}.`);
      refresh();
    } catch (e: any) { setActionError(e.message); }
    finally { setLoadingId(null); }
  };

  // Local notification overrides for optimistic read-marking
  const [readIds, setReadIds] = useState<Set<number>>(() => new Set());
  const localNotifications = notifications.map(n =>
    readIds.has(n.id) ? { ...n, read: true } : n
  );

  const markNotifRead = async (id: number) => {
    setReadIds(prev => new Set([...prev, id]));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setReadIds(new Set(notifications.map(n => n.id)));
    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch { /* silent */ }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(""); setActionSuccess(""); setLoadingId("profile");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          department: profileDept,
          year: Number(profileYear),
          bio: profileBio,
          githubUrl: profileGithub,
          linkedinUrl: profileLinkedin,
          skills: profileSkills.split(",").map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setActionSuccess("Profile saved.");
      refresh();
    } catch (e: any) { setActionError(e.message); }
    finally { setLoadingId(null); }
  };


  const appStatusStyle = (s: string) => {
    if (s === "ACCEPTED") return "badge badge-green";
    if (s === "REJECTED") return "badge badge-red";
    return "badge badge-yellow";
  };

  const departments = [
    "Computer Science", "Information Technology", "Electronics & Communication",
    "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering",
    "Biotechnology", "Food Processing Technology",
  ];

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex-1 p-5 md:p-7 space-y-6">
      {actionError && (
        <div className="p-3 text-[12px] rounded-lg bg-destructive/10 text-destructive border border-destructive/20">{actionError}</div>
      )}
      {actionSuccess && (
        <div className="p-3 text-[12px] rounded-lg bg-success/10 text-green-700 dark:text-green-400 border border-success/20">{actionSuccess}</div>
      )}

      {/* ── HOME VIEW ─────────────────────────────────────── */}
      {currentTab === "home" && (
        <div className="space-y-6">

          {/* Greeting + CTA */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-border">
            <div>
              <h1 className="text-[21px] font-bold tracking-tight text-foreground leading-tight">
                Welcome back, {currentUser?.name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {projects.length > 0
                  ? `You have ${projects.length} active project${projects.length !== 1 ? "s" : ""}.`
                  : "Start by posting your first project."}
              </p>
            </div>
            <Link href="/projects/create" className="btn-primary text-[12px] py-2 px-3.5 shrink-0 flex items-center gap-1.5">
              <Plus size={13} strokeWidth={2} /> New
            </Link>
          </div>

          {/* Quick-stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "My projects",  value: projects.length,                                     href: "/dashboard?tab=projects" },
              { label: "Applications", value: applications.length,                                  href: "/dashboard?tab=applications" },
              { label: "Pending",      value: applications.filter((a: any) => a.status === "PENDING").length, href: "/dashboard?tab=applications" },
              { label: "Unread",       value: recentNotifications.filter((n: any) => !n.read).length, href: "/dashboard?tab=notifications" },
            ].map(({ label, value, href }) => (
              <Link key={label} href={href}
                className="card px-4 py-3.5 flex flex-col gap-1 hover:border-muted-foreground/25 transition-all"
              >
                <span className="text-[24px] font-extrabold text-foreground tracking-tight leading-none tabular-nums">{value}</span>
                <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_264px] gap-6 items-start">

          {/* ── LEFT: recommended + activity ── */}
          <div className="space-y-6">

          {/* Recommended */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-foreground">Open to join</h2>
              <Link href="/projects" className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                Browse all →
              </Link>
            </div>

            <div className="space-y-2">
              {recommendedProjects && recommendedProjects.length > 0 ? (
                recommendedProjects.map((project) => {
                  const iconInfo = getProjectIcon(project.title);
                  const Icon = iconInfo.icon;
                  return (
                    <article key={project.id} className="card p-4 flex items-start gap-3 hover:border-muted-foreground/25 transition-all group">
                      <div className={`h-9 w-9 rounded-lg ${iconInfo.bg} border border-border flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={15} className={iconInfo.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1 group-hover:underline underline-offset-2">
                            <Link href={`/projects/${project.id}`}>{project.title}</Link>
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {project.status === "OPEN" && <span className="badge badge-green">Open</span>}
                            {project.status === "FULL" && <span className="badge badge-yellow">Full</span>}
                            {project.status === "CLOSED" && <span className="badge badge-red">Closed</span>}
                            <button
                              onClick={() => toggleBookmark(project.id)}
                              className={`p-0.5 rounded transition-colors cursor-pointer ${bookmarkedIds.has(project.id) ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                              aria-label="Bookmark"
                            >
                              <Bookmark size={12} strokeWidth={1.75} className={bookmarkedIds.has(project.id) ? "fill-foreground" : ""} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed mb-1.5">
                          {project.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {project.skills?.slice(0, 3).map((skill: any) => (
                              <span key={skill.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">by {project.owner?.name}</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="card p-8 text-center text-[12px] text-muted-foreground">No open projects at the moment.</div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="space-y-3">
            <h2 className="text-[13px] font-bold text-foreground">Recent activity</h2>
            <div className="card overflow-hidden divide-y divide-border">
              {recentNotifications && recentNotifications.length > 0 ? (
                recentNotifications.slice(0, 4).map((notif) => (
                  <Link
                    key={notif.id}
                    href={getNotificationLink(notif)}
                    className="flex items-center gap-3 px-4 py-3 text-[12px] hover:bg-secondary/20 transition-colors"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${notif.read ? "bg-muted-foreground/30" : "bg-foreground"}`} />
                    <span className="text-foreground flex-1 truncate leading-snug">{notif.message}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">No recent activity.</p>
              )}
            </div>
          </div>

          </div>{/* end left */}

          {/* ── RIGHT: sidebar panels ── */}
          <div className="space-y-4 hidden lg:block">

            {/* My Projects */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-bold text-foreground">My projects</h3>
                <Link href="/projects/create" className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">+ New</Link>
              </div>
              <div className="space-y-2.5">
                {myProjectsSidebar && myProjectsSidebar.length > 0 ? (
                  myProjectsSidebar.map((proj) => (
                    <div key={proj.id} className="flex items-center justify-between gap-2">
                      <Link href={`/projects/${proj.id}`} className="text-[12px] font-medium text-foreground hover:underline underline-offset-2 line-clamp-1 min-w-0">{proj.title}</Link>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold shrink-0 ${proj.status === "OPEN" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${proj.status === "OPEN" ? "bg-green-500" : proj.status === "FULL" ? "bg-blue-500" : "bg-muted-foreground/40"}`} />
                        {proj.status === "OPEN" ? "Open" : proj.status === "FULL" ? "Full" : "Closed"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">No projects yet.</p>
                )}
              </div>
              <div className="border-t border-border mt-3 pt-2.5">
                <Link href="/dashboard?tab=projects" className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">All projects →</Link>
              </div>
            </div>

            {/* Applications */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-bold text-foreground">Applications</h3>
                <Link href="/dashboard?tab=applications" className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">View all</Link>
              </div>
              <div className="space-y-2.5">
                {myApplicationsSidebar && myApplicationsSidebar.length > 0 ? (
                  myApplicationsSidebar.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-2">
                      <Link href={`/projects/${app.project.id}`} className="text-[12px] font-medium text-foreground hover:underline underline-offset-2 line-clamp-1 min-w-0">{app.project.title}</Link>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${app.status === "ACCEPTED" ? "bg-green-500/10 text-green-600 dark:text-green-400" : app.status === "REJECTED" ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"}`}>
                        {app.status === "ACCEPTED" ? "Accepted" : app.status === "REJECTED" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">No applications yet.</p>
                )}
              </div>
            </div>

            {/* Saved */}
            {myBookmarksSidebar && myBookmarksSidebar.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-bold text-foreground">Saved</h3>
                  <Link href="/dashboard?tab=bookmarks" className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">View all</Link>
                </div>
                <div className="space-y-2">
                  {myBookmarksSidebar.map((bm) => (
                    <div key={bm.project.id} className="flex items-center gap-2">
                      <Bookmark size={11} className="text-muted-foreground/50 shrink-0" />
                      <Link href={`/projects/${bm.project.id}`} className="text-[12px] font-medium text-foreground hover:underline underline-offset-2 line-clamp-1">{bm.project.title}</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* end right */}

          </div>{/* end two-column */}

          {/* Mobile quick actions */}
          <div className="sm:hidden grid grid-cols-3 gap-2 pt-1">
            {[
              { href: "/projects/create", icon: Plus,   label: "New project" },
              { href: "/projects",        icon: Search, label: "Discover" },
              { href: "/dashboard?tab=collaborations", icon: Users, label: "Collaborators" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 p-3 card hover:border-muted-foreground/25 transition-all">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <Icon size={15} className="text-foreground" />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center">{label}</span>
              </Link>
            ))}
          </div>

        </div>
      )}


      {/* ── COLLABORATIONS — people finder ────────────────── */}
      {currentTab === "collaborations" && (
        <CollaborationsFinder
          people={collaborations}
          collabSearch={collabSearch}
          setCollabSearch={setCollabSearch}
          collabDept={collabDept}
          setCollabDept={setCollabDept}
          collabSkill={collabSkill}
          setCollabSkill={setCollabSkill}
          collabStatus={collabStatus}
          setCollabStatus={setCollabStatus}
          hasProjects={projects.length > 0}
          onInviteUser={(user: any) => {
            setInviteTargetUser(user);
            setInviteProjectId(projects[0]?.id?.toString() || "");
            setInviteModalOpen(true);
          }}
        />
      )}



      {/* ── HACKATHONS VIEW ────────────────────────────────── */}
      {currentTab === "hackathons" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[17px] font-bold text-foreground tracking-tight">Campus Hackathons</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Participate in campus and student-led hackathons &amp; competitions.</p>
          </div>

          {hackathons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hackathons.map((h) => (
                <div key={h.id} className="card p-5 space-y-4 flex flex-col justify-between border-border relative">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0 text-[18px]">
                        🏆
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-foreground leading-snug">{h.title}</h3>
                        <span className="text-[10px] text-muted-foreground font-medium">📅 {h.date}</span>
                      </div>
                    </div>

                    <p className="text-[12px] text-muted-foreground leading-relaxed pt-1">
                      {h.description}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground font-medium pt-2">
                      <span className="flex items-center gap-1">📍 {h.location}</span>
                      <span className="flex items-center gap-1">👥 {h.teamSize}</span>
                      {h.prize && <span className="flex items-center gap-1 text-amber-500 font-semibold">🏆 {h.prize}</span>}
                    </div>
                  </div>

                  {h.link ? (
                    <div className="border-t border-border pt-3">
                      <a
                        href={h.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full justify-center text-[12px] py-2 flex items-center gap-1.5 font-bold"
                      >
                        Register Now ↗
                      </a>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-3">
                      <span className="text-[11px] text-muted-foreground italic">Registration opens soon</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center space-y-2">
              <Trophy size={32} className="mx-auto text-muted-foreground/40" />
              <p className="text-[14px] font-medium text-foreground">No upcoming hackathons right now</p>
              <p className="text-[12px] text-muted-foreground">Check back soon for upcoming student hackathons and competitions.</p>
            </div>
          )}
        </div>
      )}

      {/* ── BOOKMARKS ─────────────────────────────────────── */}
      {currentTab === "bookmarks" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Bookmarks</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Projects you saved for later.</p>
          </div>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((bm) => {
                const p = bm.project;
                const iconInfo = getProjectIcon(p.title);
                const Icon = iconInfo.icon;
                return (
                  <div key={p.id} className="card p-5 flex flex-col gap-3 hover:border-muted-foreground/25 transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-9 w-9 rounded-lg ${iconInfo.bg} border border-border flex items-center justify-center shrink-0`}>
                        <Icon size={16} className={iconInfo.text} />
                      </div>
                      {p.status === "OPEN" ? (
                        <span className="badge badge-green mt-0.5">Open</span>
                      ) : p.status === "FULL" ? (
                        <span className="badge badge-yellow mt-0.5">Full</span>
                      ) : (
                        <span className="badge badge-red mt-0.5">Closed</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-foreground group-hover:underline underline-offset-2">
                        <Link href={`/projects/${p.id}`}>{p.title}</Link>
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        by{" "}
                        <Link href={`/profile/${p.owner.id}`} className="hover:underline">
                          {p.owner.name}
                        </Link>
                        {" · "}{p.owner.department}
                      </p>
                    </div>
                    {p.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.skills.slice(0, 3).map((s: any) => (
                          <span key={s.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
                      <span className="text-[10px] text-muted-foreground">
                        Saved {new Date(bm.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/projects/${p.id}`} className="btn-ghost text-[11px] px-2 py-1">
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-14 text-center">
              <div className="flex justify-center mb-3">
                <Bookmark size={28} strokeWidth={1.5} className="text-muted-foreground/40" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">No bookmarks yet</p>
              <p className="text-[12px] text-muted-foreground mb-5">
                Hit &ldquo;Save project&rdquo; on any project page to bookmark it here.
              </p>
              <Link href="/projects" className="btn-secondary text-[13px] py-2 px-4 inline-flex">
                Browse projects
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── MY PROJECTS ───────────────────────────────────── */}
      {currentTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-foreground tracking-tight">My projects</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Manage recruitment and review applications.</p>
            </div>
            <Link href="/projects/create" className="btn-primary text-[12px] py-1.5 px-3">
              New project
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="card overflow-hidden">
                  {/* Project header */}
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-[14px] font-semibold text-foreground">
                          <Link href={`/projects/${project.id}`} className="hover:underline underline-offset-2">
                            {project.title}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={project.status === "OPEN" ? "badge badge-green" : "badge badge-red"}>
                            {project.status}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {project.applications.length} application{project.applications.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                        title="Edit project details"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => statusToggle(project.id, project.status)}
                        disabled={loadingId !== null}
                        className="btn-secondary text-[12px] py-1.5 px-3"
                      >
                        {loadingId === `status-${project.id}` ? "…" : project.status === "OPEN" ? "Close" : "Reopen"}
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        disabled={loadingId !== null}
                        className="btn-ghost p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Applications list */}
                  <div className="px-5 py-4">
                    <p className="section-label mb-3">Applications</p>
                    {project.applications.length > 0 ? (
                      <div className="divide-y divide-border">
                        {project.applications.map((app: any) => (
                          <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-2 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/profile/${app.user.id}`}
                                  className="text-[13px] font-semibold text-foreground hover:underline underline-offset-2"
                                >
                                  {app.user.name}
                                </Link>
                                <span className="text-[11px] text-muted-foreground">
                                  {app.user.department} · Year {app.user.year}
                                </span>
                              </div>
                              {app.message && (
                                <p className="text-[12px] text-foreground leading-relaxed bg-secondary rounded-md p-3 border border-border">
                                  {app.message}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-start">
                              {app.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => applicationAction(app.id, "ACCEPTED")}
                                    disabled={loadingId !== null}
                                    className="btn-primary text-[12px] py-1.5 px-3 gap-1"
                                  >
                                    <Check size={12} strokeWidth={2} /> Accept
                                  </button>
                                  <button
                                    onClick={() => applicationAction(app.id, "REJECTED")}
                                    disabled={loadingId !== null}
                                    className="btn-secondary text-[12px] py-1.5 px-3 gap-1"
                                  >
                                    <X size={12} strokeWidth={2} /> Decline
                                  </button>
                                </>
                              ) : (
                                <span className={appStatusStyle(app.status)}>{app.status}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground italic">No applications yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-[14px] font-medium text-foreground mb-1">No projects yet</p>
              <p className="text-[12px] text-muted-foreground mb-4">Post your first project to start finding collaborators.</p>
              <Link href="/projects/create" className="btn-primary text-[13px] py-2 px-4 inline-flex">
                Create a project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── MY APPLICATIONS ───────────────────────────────── */}
      {currentTab === "applications" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground tracking-tight">My applications</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Track your collaboration requests.</p>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground mb-0.5">
                      <Link href={`/projects/${app.project.id}`} className="hover:underline underline-offset-2">
                        {app.project.title}
                      </Link>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      by{" "}
                      <Link href={`/profile/${app.project.owner?.id}`} className="hover:underline">
                        {app.project.owner?.name}
                      </Link>
                      {" · "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    {app.message && (
                      <p className="text-[12px] text-muted-foreground mt-2 italic line-clamp-2">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className={`${appStatusStyle(app.status)} shrink-0 self-start sm:self-center`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-[14px] font-medium text-foreground mb-1">No applications yet</p>
              <p className="text-[12px] text-muted-foreground mb-4">Find a project you like and apply to join the team.</p>
              <Link href="/projects" className="btn-secondary text-[13px] py-2 px-4 inline-flex">
                Browse projects
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── INVITATIONS VIEW ──────────────────────────────── */}
      {currentTab === "invitations" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-[17px] font-bold text-foreground tracking-tight flex items-center gap-2">
                <Mail size={18} strokeWidth={2} />
                Project Invitations
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Manage collaboration invitations sent to you or sent by you.
              </p>
            </div>
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setInviteTargetUser(null);
                  setInviteProjectId(projects[0]?.id?.toString() || "");
                  setInviteModalOpen(true);
                }}
                className="btn-primary text-[12px] py-1.5 px-3.5 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <UserPlus size={13} strokeWidth={2} /> Send Invitation
              </button>
            )}
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <button
              type="button"
              onClick={() => setInvitationSubTab("received")}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                invitationSubTab === "received"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Received
              {receivedNotifs.filter(i => i.status === "PENDING").length > 0 && (
                <span className="h-4 min-w-[16px] px-1.5 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
                  {receivedNotifs.filter(i => i.status === "PENDING").length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setInvitationSubTab("sent")}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                invitationSubTab === "sent"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sent ({sentNotifs.length})
            </button>
          </div>

          {/* RECEIVED TAB */}
          {invitationSubTab === "received" && (
            <div className="space-y-4">
              {receivedNotifs.length > 0 ? (
                <div className="space-y-3">
                  {receivedNotifs.map((inv) => (
                    <div key={inv.id} className="card p-5 space-y-3 border-border hover:border-muted-foreground/25 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[14px] font-semibold text-foreground">
                              <Link href={`/projects/${inv.project.id}`} className="hover:underline underline-offset-2">
                                {inv.project.title}
                              </Link>
                            </h3>
                            <span className={inv.project.status === "OPEN" ? "badge badge-green" : "badge badge-red"}>
                              {inv.project.status}
                            </span>
                            {inv.role && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                Role: {inv.role}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Invited by <strong className="text-foreground">{inv.sender?.name}</strong> ({inv.sender?.department}) · {new Date(inv.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="shrink-0 self-start sm:self-center">
                          {inv.status === "PENDING" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRespondInvitation(inv.id, "ACCEPTED")}
                                disabled={loadingId !== null}
                                className="btn-primary text-[12px] py-1.5 px-3 gap-1 cursor-pointer"
                              >
                                <Check size={12} strokeWidth={2} /> Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondInvitation(inv.id, "DECLINED")}
                                disabled={loadingId !== null}
                                className="btn-secondary text-[12px] py-1.5 px-3 gap-1 cursor-pointer"
                              >
                                <X size={12} strokeWidth={2} /> Decline
                              </button>
                            </div>
                          ) : inv.status === "ACCEPTED" ? (
                            <span className="badge badge-green">Accepted</span>
                          ) : (
                            <span className="badge badge-red">Declined</span>
                          )}
                        </div>
                      </div>

                      {inv.message && (
                        <div className="text-[12px] text-foreground bg-secondary/60 rounded-lg p-3 border border-border italic leading-relaxed">
                          &ldquo;{inv.message}&rdquo;
                        </div>
                      )}

                      {inv.project.skills && inv.project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {inv.project.skills.map((s: any) => (
                            <span key={s.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center space-y-2">
                  <Mail size={32} className="mx-auto text-muted-foreground/40" />
                  <p className="text-[14px] font-medium text-foreground">No invitations received yet</p>
                  <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                    When project owners invite you to join their projects, their invitations will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SENT TAB */}
          {invitationSubTab === "sent" && (
            <div className="space-y-4">
              {sentNotifs.length > 0 ? (
                <div className="space-y-3">
                  {sentNotifs.map((inv) => (
                    <div key={inv.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[13px] font-semibold text-foreground">
                            Invite to {inv.receiver?.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ({inv.receiver?.department})
                          </span>
                          {inv.role && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                              {inv.role}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Project: <Link href={`/projects/${inv.project?.id}`} className="font-medium text-foreground hover:underline">{inv.project?.title}</Link> · Sent {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                        {inv.message && (
                          <p className="text-[11px] text-muted-foreground italic mt-1.5 line-clamp-1">
                            &ldquo;{inv.message}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        <span className={inv.status === "ACCEPTED" ? "badge badge-green" : inv.status === "DECLINED" ? "badge badge-red" : "badge badge-yellow"}>
                          {inv.status}
                        </span>
                        {inv.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleCancelInvitation(inv.id)}
                            disabled={loadingId !== null}
                            className="btn-ghost p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
                            title="Cancel invitation"
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center space-y-2">
                  <Send size={32} className="mx-auto text-muted-foreground/40" />
                  <p className="text-[14px] font-medium text-foreground">No invitations sent</p>
                  <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                    You haven&apos;t sent any project invitations yet. Browse the Collaborators directory to find students and invite them!
                  </p>
                  <Link href="/dashboard?tab=collaborations" className="btn-secondary text-[12px] py-2 px-4 inline-flex mt-2">
                    Find Collaborators →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Send Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-4 bg-card shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-foreground" />
                <h3 className="text-[15px] font-bold text-foreground">
                  {inviteTargetUser ? `Invite ${inviteTargetUser.name}` : "Send Project Invitation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="btn-ghost p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="space-y-4">
              {!inviteTargetUser ? (
                <div>
                  <label className="block section-label mb-1.5">Recipient Student</label>
                  <select
                    required
                    value={inviteTargetUser?.id || ""}
                    onChange={(e) => {
                      const u = collaborations.find((c: any) => c.id === Number(e.target.value));
                      setInviteTargetUser(u || null);
                    }}
                    className="forge-input cursor-pointer"
                  >
                    <option value="">Select a student…</option>
                    {collaborations.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.department || "Student"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[13px]">
                    {inviteTargetUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{inviteTargetUser.name}</p>
                    <p className="text-[10px] text-muted-foreground">{inviteTargetUser.department}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block section-label mb-1.5">Select Your Project</label>
                <select
                  required
                  value={inviteProjectId}
                  onChange={(e) => setInviteProjectId(e.target.value)}
                  className="forge-input cursor-pointer"
                >
                  <option value="">Select project…</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block section-label mb-1.5">Proposed Role (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer, UI Designer, ML Dev"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="forge-input"
                />
              </div>

              <div>
                <label className="block section-label mb-1.5">Personal Message (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Hey, we'd love for you to join our project team!"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="forge-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="btn-secondary text-[12px] py-1.5 px-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSending || !inviteProjectId || !inviteTargetUser}
                  className="btn-primary text-[12px] py-1.5 px-4 font-bold cursor-pointer flex items-center gap-1.5"
                >
                  {inviteSending ? "Sending…" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ─────────────────────────────────── */}
      {currentTab === "notifications" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Notifications</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Application status updates and alerts.</p>
            </div>
            {localNotifications.some((n) => !n.read) && (
              <button
                onClick={markAllRead}
                className="btn-ghost text-[12px]"
              >
                Mark all read
              </button>
            )}
          </div>

          {localNotifications.length > 0 ? (
            <div className="space-y-2">
              {localNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markNotifRead(notif.id);
                    router.push(getNotificationLink(notif));
                  }}
                  className="card p-4 transition-all cursor-pointer hover:border-muted-foreground/40 hover:bg-secondary/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                          notif.read ? "bg-transparent" : "bg-foreground"
                        }`}
                        aria-hidden="true"
                      />
                      <p className="text-[13px] text-foreground leading-relaxed">{notif.message}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-[13px] text-muted-foreground">You&apos;re all caught up.</p>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE SETTINGS ──────────────────────────────── */}
      {currentTab === "profile" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Profile settings</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Manage your account details and public profile.</p>
          </div>

          <div className="card p-6">
            <form onSubmit={saveProfile} className="space-y-5">
              {/* Name + Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block section-label mb-1.5">Full name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1.5">Year of study</label>
                  <select
                    required
                    value={profileYear}
                    onChange={(e) => setProfileYear(e.target.value)}
                    className="forge-input cursor-pointer"
                  >
                    <option value="">Select…</option>
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>{y}{["st","nd","rd","th"][y-1]} Year</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block section-label mb-1.5">Department</label>
                <select
                  required
                  value={profileDept}
                  onChange={(e) => setProfileDept(e.target.value)}
                  className="forge-input cursor-pointer"
                >
                  <option value="">Select…</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block section-label mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="A short intro about yourself and your interests…"
                  className="forge-input resize-none"
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block section-label mb-1.5 flex items-center gap-1.5">
                    <GitBranch size={11} strokeWidth={1.75} />
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={profileGithub}
                    onChange={(e) => setProfileGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="forge-input"
                  />
                </div>
                <div>
                  <label className="block section-label mb-1.5 flex items-center gap-1.5">
                    <Link2 size={11} strokeWidth={1.75} />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profileLinkedin}
                    onChange={(e) => setProfileLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="forge-input"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block section-label mb-1.5">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="React, Python, Arduino, Figma…"
                  className="forge-input"
                />
              </div>

              {/* Save */}
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={loadingId === "profile"}
                  className="btn-primary text-[13px] py-2 px-5"
                >
                  {loadingId === "profile" ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="card p-5 border-destructive/30 bg-destructive/5 space-y-3 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-[13px] font-bold text-destructive">Danger Zone</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Permanently delete your account and all associated projects, applications, and data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-ghost text-[12px] px-3.5 py-1.5 text-destructive hover:bg-destructive/15 border border-destructive/30 font-semibold shrink-0 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-[400px] p-6 space-y-4 border-destructive/40 bg-card shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <Trash2 size={22} />
              <h3 className="text-[16px] font-bold">Delete Account?</h3>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              This action is <strong className="text-foreground">permanent and cannot be undone</strong>. All your projects, applications, bookmarks, and account data will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary text-[12px] py-1.5 px-3 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="btn-primary bg-destructive hover:bg-destructive/90 text-white border-none text-[12px] py-1.5 px-4 font-bold cursor-pointer"
              >
                {deletingAccount ? "Deleting…" : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal for brand new accounts */}
      <OnboardingModal
        user={profileData}
        onComplete={(updatedUser: any) => {
          if (updatedUser) {
            setProfileName(updatedUser.name || "");
            setProfileDept(updatedUser.department || "");
            setProfileYear(updatedUser.year?.toString() || "");
          }
        }}
      />

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onProjectUpdated={(updated: any) => {
            setProjects((prev: any[]) =>
              prev.map((p: any) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CollaborationsFinder — standalone sub-component
   Receives already-fetched people array and filter state from parent.
   All filtering is done client-side (no extra network call).
═══════════════════════════════════════════════════════════════ */

interface CFProps {
  people: any[];
  collabSearch: string;
  setCollabSearch: (v: string) => void;
  collabDept: string;
  setCollabDept: (v: string) => void;
  collabSkill: string;
  setCollabSkill: (v: string) => void;
  collabStatus: "all" | "open" | "busy";
  setCollabStatus: (v: "all" | "open" | "busy") => void;
  hasProjects?: boolean;
  onInviteUser?: (user: any) => void;
}

function CollaborationsFinder({
  people,
  collabSearch, setCollabSearch,
  collabDept,   setCollabDept,
  collabSkill,  setCollabSkill,
  collabStatus, setCollabStatus,
  hasProjects = false,
  onInviteUser,
}: CFProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // "open to collaborate" = has no currently-OPEN project they own
  const isOpenToWork = (u: any) =>
    !(u.projects || []).some((p: any) => p.status === "OPEN");

  // Unique department list from the data
  const allDepts = Array.from(
    new Set(people.map((u: any) => u.department as string))
  ).sort();

  // Unique skill list from the data
  const allSkills = Array.from(
    new Set(people.flatMap((u: any) => u.skills.map((s: any) => s.name as string)))
  ).sort();

  // Filter logic
  const filtered = people.filter((u: any) => {
    const q = collabSearch.trim().toLowerCase();
    if (
      q &&
      !u.name.toLowerCase().includes(q) &&
      !u.department.toLowerCase().includes(q) &&
      !(u.bio ?? "").toLowerCase().includes(q) &&
      !u.skills.some((s: any) => s.name.toLowerCase().includes(q))
    ) return false;
    if (collabDept && u.department !== collabDept) return false;
    if (collabSkill && !u.skills.some((s: any) => s.name === collabSkill)) return false;
    if (collabStatus === "open" && !isOpenToWork(u)) return false;
    if (collabStatus === "busy" &&  isOpenToWork(u)) return false;
    return true;
  });

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

  // Chevron arrow for selects
  const selectBg = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 8px center",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold text-foreground tracking-tight">Find collaborators</h2>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[11px] font-medium border border-border/60">
              {filtered.length}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Connect with verified students across campus and build project teams.
          </p>
        </div>
      </div>

      {/* Search + filter toolbar */}
      <div className="space-y-3 bg-secondary/40 p-3.5 rounded-xl border border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          
          {/* Search input (spans 6 cols on md) */}
          <div className="relative md:col-span-6">
            <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={collabSearch}
              onChange={(e) => setCollabSearch(e.target.value)}
              placeholder="Search by name, skill, department, or bio…"
              className="forge-input pl-9 w-full bg-card"
            />
            {collabSearch && (
              <button
                onClick={() => setCollabSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Availability toggle pills (spans 3 cols on md) */}
          <div className="md:col-span-3 flex items-center justify-between p-1 bg-card rounded-lg border border-border">
            {(["all", "open", "busy"] as const).map((val) => (
              <button
                key={val}
                onClick={() => setCollabStatus(val)}
                className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  collabStatus === val
                    ? "bg-secondary text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === "all" ? "All" : val === "open" ? "Available" : "Busy"}
              </button>
            ))}
          </div>

          {/* Department & Skill Selects (spans 3 cols on md) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <select
              value={collabDept}
              onChange={(e) => setCollabDept(e.target.value)}
              className="text-[11.5px] py-1.5 pl-2.5 pr-6 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
              style={selectBg}
            >
              <option value="">Departments</option>
              {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={collabSkill}
              onChange={(e) => setCollabSkill(e.target.value)}
              className="text-[11.5px] py-1.5 pl-2.5 pr-6 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
              style={selectBg}
            >
              <option value="">Skills</option>
              {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Active filter badges */}
        {(collabDept || collabSkill || collabSearch || collabStatus !== "all") && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[10.5px] text-muted-foreground font-medium mr-1">Active filters:</span>
            {collabDept && (
              <button
                onClick={() => setCollabDept("")}
                className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary transition-colors"
              >
                Dept: {collabDept} <X size={10} strokeWidth={2} />
              </button>
            )}
            {collabSkill && (
              <button
                onClick={() => setCollabSkill("")}
                className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary transition-colors"
              >
                Skill: {collabSkill} <X size={10} strokeWidth={2} />
              </button>
            )}
            {collabStatus !== "all" && (
              <button
                onClick={() => setCollabStatus("all")}
                className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary transition-colors"
              >
                Status: {collabStatus === "open" ? "Available" : "Busy"} <X size={10} strokeWidth={2} />
              </button>
            )}
            <button
              onClick={() => {
                setCollabSearch("");
                setCollabDept("");
                setCollabSkill("");
                setCollabStatus("all");
              }}
              className="text-[10.5px] text-muted-foreground hover:text-foreground underline ml-auto cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* People grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((u: any) => {
            const open = isOpenToWork(u);
            const initial = u.name[0].toUpperCase();
            const openProjectCount = (u.projects || []).filter((p: any) => p.status === "OPEN").length;

            return (
              <div
                key={u.id}
                className="card p-4 flex flex-col justify-between hover:border-foreground/20 hover:shadow-xs transition-all duration-200 group relative border border-border bg-card rounded-xl gap-3"
              >
                {/* Top row: avatar + info + availability badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-secondary border border-border/80 flex items-center justify-center font-semibold text-[14px] text-foreground shrink-0 overflow-hidden shadow-2xs">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13.5px] font-semibold text-foreground leading-snug truncate">
                        <Link href={`/profile/${u.id}`} className="hover:underline underline-offset-2">
                          {u.name}
                        </Link>
                      </h3>
                      <p className="text-[10.5px] text-muted-foreground truncate font-normal mt-0.5">
                        Year {u.year} · {u.department.split(" ").slice(0, 2).join(" ")}
                      </p>
                    </div>
                  </div>

                  {/* Availability badge */}
                  <div className={`flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-medium tracking-wide ${
                    open
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted border-border text-muted-foreground"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${open ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    {open ? "Available" : "Busy"}
                  </div>
                </div>

                {/* Middle: Bio & Skills */}
                <div className="flex flex-col gap-2">
                  {u.bio ? (
                    <p className="text-[11.5px] text-muted-foreground/90 leading-relaxed line-clamp-2">
                      {u.bio}
                    </p>
                  ) : null}

                  {/* Skills */}
                  {u.skills && u.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.skills.slice(0, 4).map((s: any) => (
                        <span
                          key={s.id}
                          className={`text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 border border-border/50 transition-colors cursor-pointer hover:bg-accent hover:text-foreground truncate max-w-[90px] ${
                            collabSkill === s.name ? "border-foreground/40 text-foreground bg-accent" : ""
                          }`}
                          onClick={() => setCollabSkill(collabSkill === s.name ? "" : s.name)}
                          title={`Filter by ${s.name}`}
                        >
                          {s.name}
                        </span>
                      ))}
                      {u.skills.length > 4 && (
                        <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/50">
                          +{u.skills.length - 4}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Footer: status + action buttons */}
                <div className="flex items-center justify-between border-t border-border/60 pt-2.5 mt-auto gap-1.5">
                  <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground truncate min-w-0 font-medium">
                    <span className="truncate">
                      {openProjectCount > 0
                        ? `${openProjectCount} open proj`
                        : "Open to team"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Copy email */}
                    <button
                      onClick={() => copyEmail(u.id, u.email ?? "")}
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                      title="Copy email address"
                      aria-label={`Copy ${u.name}'s email`}
                    >
                      {copiedId === u.id
                        ? <CheckCheck size={12} strokeWidth={2} className="text-success" />
                        : <Copy size={12} strokeWidth={1.75} />
                      }
                    </button>

                    {/* Invite to project */}
                    {hasProjects && onInviteUser && (
                      <button
                        type="button"
                        onClick={() => onInviteUser(u)}
                        className="btn-primary text-[10.5px] py-1 px-2.5 flex items-center gap-1 cursor-pointer rounded-md"
                        title="Invite to your project"
                      >
                        <UserPlus size={11} strokeWidth={2} /> Invite
                      </button>
                    )}

                    {/* View profile */}
                    <Link
                      href={`/profile/${u.id}`}
                      className="btn-secondary text-[10.5px] py-1 px-2.5 rounded-md"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-14 text-center border border-border/60 bg-card rounded-xl">
          <div className="flex justify-center mb-3">
            <Users size={28} strokeWidth={1.5} className="text-muted-foreground/40" />
          </div>
          <p className="text-[14px] font-medium text-foreground mb-1">No collaborators found</p>
          <p className="text-[12px] text-muted-foreground">
            Try clearing your filters or searching with a different term.
          </p>
        </div>
      )}
    </div>
  );
}
