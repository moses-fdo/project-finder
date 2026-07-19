"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import OnboardingModal from "@/components/OnboardingModal";
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
  MapPin,
  LucideIcon
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
  projects,
  applications,
  notifications,
  profileData,
  collaborations = [],
  bookmarks = [],
  hackathons = [],
  recommendedProjects = [],
  myProjectsSidebar = [],
  myApplicationsSidebar = [],
  myBookmarksSidebar = [],
  recentNotifications = [],
}: DashboardViewClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [currentTab, setCurrentTab] = useState(activeTab || "home");

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const [profileName,     setProfileName]     = useState(profileData?.name         || "");
  const [profileDept,     setProfileDept]     = useState(profileData?.department   || "");
  const [profileYear,     setProfileYear]     = useState(profileData?.year?.toString() || "");
  const [profileBio,      setProfileBio]      = useState(profileData?.bio          || "");
  const [profileGithub,   setProfileGithub]   = useState(profileData?.githubUrl    || "");
  const [profileLinkedin, setProfileLinkedin] = useState(profileData?.linkedinUrl  || "");
  const [profileSkills,   setProfileSkills]   = useState(
    profileData?.skills?.map((s: any) => s.name).join(", ") || ""
  );

  useEffect(() => {
    if (profileData) {
      setProfileName(profileData.name || "");
      setProfileDept(profileData.department || "");
      setProfileYear(profileData.year?.toString() || "");
      setProfileBio(profileData.bio || "");
      setProfileGithub(profileData.githubUrl || "");
      setProfileLinkedin(profileData.linkedinUrl || "");
      setProfileSkills(profileData.skills?.map((s: any) => s.name).join(", ") || "");
    }
  }, [profileData]);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(
    () => new Set(bookmarks.map((bm: any) => bm.project?.id ?? bm.projectId))
  );

  const toggleBookmark = async (projectId: number) => {
    const isBookmarked = bookmarkedIds.has(projectId);
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      isBookmarked ? next.delete(projectId) : next.add(projectId);
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

  const refresh = () => startTransition(() => router.refresh());

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

  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const markNotifRead = async (id: number) => {
    setLocalNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
    <div className="flex-1 p-5 md:p-8 space-y-5">
      {actionError && (
        <div className="p-3 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 text-[12px] rounded-md notion-tag-green border border-green-200/20">
          {actionSuccess}
        </div>
      )}

      {/* ── HOME VIEW ─────────────────────────────────────── */}
      {currentTab === "home" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Middle Column (lg:col-span-8): Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header Greeting */}
            <div className="space-y-1">
              <h1 className="text-[22px] font-bold tracking-tight text-foreground md:text-[24px]">
                Good morning, {currentUser?.name?.split(" ")[0] || "Moses"} <span className="md:inline hidden">👋</span>
              </h1>
              <p className="text-[13px] text-muted-foreground">
                Let&apos;s build something amazing today.
              </p>
            </div>

            {/* Mobile Search Bar (Only shown on mobile) */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("search") as HTMLInputElement)?.value;
              if (q) router.push(`/projects?search=${encodeURIComponent(q)}`);
              else router.push("/projects");
            }} className="md:hidden relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search size={14} className="text-muted-foreground" />
              </span>
              <input
                name="search"
                type="text"
                placeholder="Search projects, skills, people..."
                className="w-full pl-9 py-2 bg-secondary/50 border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </form>

            {/* Mobile Quick Actions (Only shown on mobile) */}
            <div className="md:hidden space-y-2.5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                <Link href="/projects/create" className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="h-9 w-9 bg-secondary border border-border rounded-lg flex items-center justify-center mb-1.5 font-bold">
                    <Plus size={16} className="text-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground text-center line-clamp-1">New Project</span>
                </Link>
                <Link href="/projects" className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="h-9 w-9 bg-secondary border border-border rounded-lg flex items-center justify-center mb-1.5">
                    <Search size={16} className="text-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground text-center line-clamp-1">Discover</span>
                </Link>
                <Link href="/dashboard?tab=collaborations" className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="h-9 w-9 bg-secondary border border-border rounded-lg flex items-center justify-center mb-1.5">
                    <Users size={16} className="text-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground text-center line-clamp-1">Collabs</span>
                </Link>
              </div>
            </div>

            {/* Recommended For You Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-foreground tracking-tight">Recommended for you</h2>
                <Link href="/projects" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  View all <span className="text-[13px] leading-none">→</span>
                </Link>
              </div>

              {/* Recommended list - Grid on PC, list on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedProjects && recommendedProjects.length > 0 ? (
                  recommendedProjects.map((project) => {
                    const iconInfo = getProjectIcon(project.title);
                    const Icon = iconInfo.icon;
                    return (
                      <article key={project.id} className="card p-5 flex flex-col justify-between h-full hover:border-muted-foreground/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all relative group">
                        <div>
                          {/* Top Card Bar */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className={`h-8 w-8 rounded-lg ${iconInfo.bg} flex items-center justify-center border border-border shrink-0`}>
                              <Icon size={16} className={iconInfo.text} />
                            </div>
                            <button
                              onClick={() => toggleBookmark(project.id)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                bookmarkedIds.has(project.id)
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              aria-label={bookmarkedIds.has(project.id) ? "Remove bookmark" : "Bookmark project"}
                              title={bookmarkedIds.has(project.id) ? "Remove bookmark" : "Save project"}
                            >
                              <Bookmark
                                size={14}
                                className={bookmarkedIds.has(project.id) ? "fill-foreground" : ""}
                              />
                            </button>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-2">
                            {project.status === "OPEN" ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Looking for team</span>
                            ) : project.status === "FULL" ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">In Progress</span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Closed</span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-[14px] font-bold text-foreground leading-snug group-hover:underline decoration-1 underline-offset-2">
                            <Link href={`/projects/${project.id}`}>{project.title}</Link>
                          </h3>

                          {/* Description */}
                          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>

                          {/* Tags */}
                          {project.skills && project.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {project.skills.slice(0, 3).map((skill: any) => (
                                <span key={skill.id} className="text-[9px] font-medium px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{skill.name}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer (Owner info) */}
                        <div className="flex items-center justify-between border-t border-border mt-4 pt-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-bold text-foreground shrink-0">
                              {project.owner?.name?.[0]?.toUpperCase() || "U"}
                            </span>
                            <span className="text-[11px] font-medium text-foreground truncate">
                              {project.owner?.name || "Student Project"}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                            {project.applications?.length || 0} applicant{(project.applications?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="col-span-3 card p-8 text-center text-[12px] text-muted-foreground">
                    No recommended projects at the moment.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4 hidden md:block">
              <h2 className="text-[15px] font-bold text-foreground tracking-tight">Recent Activity</h2>
              <div className="card divide-y divide-border">
                {recentNotifications && recentNotifications.length > 0 ? (
                  recentNotifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="p-3.5 flex items-center justify-between text-[12px] hover:bg-secondary/15 transition-all">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="text-foreground">{notif.message}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-[11px] text-muted-foreground italic text-center">No recent activity.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (lg:col-span-4): Sidebars & Widgets (PC only) */}
          <div className="lg:col-span-4 space-y-6 hidden lg:block">
            
            {/* My Projects Panel */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground tracking-tight">My Projects</h3>
                <Link href="/projects/create" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">+ New</Link>
              </div>
              <div className="space-y-3">
                {myProjectsSidebar && myProjectsSidebar.length > 0 ? (
                  myProjectsSidebar.map((proj) => (
                    <div key={proj.id} className="flex items-center justify-between text-[12px]">
                      <Link href={`/projects/${proj.id}`} className="font-medium text-foreground hover:underline line-clamp-1">{proj.title}</Link>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          proj.status === "OPEN" ? "bg-green-500" : proj.status === "FULL" ? "bg-blue-500" : "bg-red-500"
                        }`} />
                        {proj.status === "OPEN" ? "Looking for team" : proj.status === "FULL" ? "In Progress" : "Completed"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No projects yet.</p>
                )}
              </div>
              <div className="border-t border-border pt-3">
                <Link href="/dashboard?tab=projects" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                  View all projects <span className="text-[13px] leading-none">→</span>
                </Link>
              </div>
            </div>

            {/* Applications Panel */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground tracking-tight">Applications</h3>
                <Link href="/dashboard?tab=applications" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">View all</Link>
              </div>
              <div className="space-y-3">
                {myApplicationsSidebar && myApplicationsSidebar.length > 0 ? (
                  myApplicationsSidebar.map((app) => (
                    <div key={app.id} className="flex items-center justify-between text-[12px] gap-2">
                      <div className="min-w-0">
                        <Link href={`/projects/${app.project.id}`} className="font-medium text-foreground hover:underline line-clamp-1">{app.project.title}</Link>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Applied recently</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        app.status === "ACCEPTED" ? "bg-green-500/10 text-green-600" : app.status === "REJECTED" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"
                      }`}>{app.status === "ACCEPTED" ? "Accepted" : app.status === "REJECTED" ? "Rejected" : "Pending"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No applications yet.</p>
                )}
              </div>
            </div>

            {/* Bookmarks Panel */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground tracking-tight">Bookmarks</h3>
                <Link href="/dashboard?tab=bookmarks" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">View all</Link>
              </div>
              <div className="space-y-2.5">
                {myBookmarksSidebar && myBookmarksSidebar.length > 0 ? (
                  myBookmarksSidebar.map((bm) => (
                    <div key={bm.project.id} className="flex items-center gap-2 text-[12px]">
                      <Bookmark size={13} className="text-purple-500 shrink-0" />
                      <Link href={`/projects/${bm.project.id}`} className="font-medium text-foreground hover:underline line-clamp-1">{bm.project.title}</Link>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No saved bookmarks yet.</p>
                )}
              </div>
            </div>

            {/* Quote widget */}
            <div className="card p-5 bg-secondary/25 border border-border/80 relative space-y-3">
              <span className="text-[28px] font-serif text-muted-foreground/30 absolute top-2 left-3 leading-none select-none">&ldquo;</span>
              <p className="text-[12px] text-muted-foreground font-medium italic leading-relaxed pt-2 pl-2">
                Great things are never done by one person. They&apos;re done by a team.
              </p>
              <p className="text-[10px] text-foreground font-bold tracking-tight text-right pr-2">
                — Steve Jobs
              </p>
            </div>

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
                  onClick={() => !notif.read && markNotifRead(notif.id)}
                  className={[
                    "card p-4 transition-all",
                    notif.read ? "opacity-50" : "cursor-pointer hover:border-muted-foreground/30",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground mt-1.5 shrink-0" aria-hidden="true" />
                      )}
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
}

function CollaborationsFinder({
  people,
  collabSearch, setCollabSearch,
  collabDept,   setCollabDept,
  collabSkill,  setCollabSkill,
  collabStatus, setCollabStatus,
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
      <div>
        <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Find collaborators</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Browse verified Karunya students and find people with the skills you need.
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={collabSearch}
            onChange={(e) => setCollabSearch(e.target.value)}
            placeholder="Search by name, skill, department, or bio…"
            className="forge-input pl-9 w-full"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">

          {/* Availability pills */}
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg border border-border">
            {(["all", "open", "busy"] as const).map((val) => (
              <button
                key={val}
                onClick={() => setCollabStatus(val)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  collabStatus === val
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === "all" ? "Everyone" : val === "open" ? "Available" : "Busy"}
              </button>
            ))}
          </div>

          {/* Department select */}
          <select
            value={collabDept}
            onChange={(e) => setCollabDept(e.target.value)}
            className="text-[12px] py-1.5 pl-2.5 pr-7 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary transition-colors appearance-none"
            style={selectBg}
          >
            <option value="">All departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Skill select */}
          <select
            value={collabSkill}
            onChange={(e) => setCollabSkill(e.target.value)}
            className="text-[12px] py-1.5 pl-2.5 pr-7 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary transition-colors appearance-none"
            style={selectBg}
          >
            <option value="">All skills</option>
            {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Active filter pills */}
          {collabDept && (
            <button
              onClick={() => setCollabDept("")}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-secondary text-foreground border border-border hover:bg-accent transition-colors"
            >
              {collabDept} <X size={10} strokeWidth={2} />
            </button>
          )}
          {collabSkill && (
            <button
              onClick={() => setCollabSkill("")}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-secondary text-foreground border border-border hover:bg-accent transition-colors"
            >
              {collabSkill} <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "person" : "people"} found
          {collabSearch || collabDept || collabSkill || collabStatus !== "all" ? " matching your filters" : ""}
        </p>
      </div>

      {/* People grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u: any) => {
            const open = isOpenToWork(u);
            const initial = u.name[0].toUpperCase();
            const openProjectCount = (u.projects || []).filter((p: any) => p.status === "OPEN").length;

            return (
              <div
                key={u.id}
                className="card p-5 flex flex-col gap-4 hover:border-muted-foreground/25 transition-all group"
              >
                {/* Top row: avatar + availability badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center font-semibold text-[15px] text-foreground shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-foreground leading-snug truncate">
                        <Link href={`/profile/${u.id}`} className="hover:underline underline-offset-2">
                          {u.name}
                        </Link>
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Year {u.year} · {u.department.split(" ").slice(0, 2).join(" ")}
                      </p>
                    </div>
                  </div>

                  {/* Availability dot + label */}
                  <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${
                    open
                      ? "bg-success/10 border-success/20 text-green-600 dark:text-green-400"
                      : "bg-muted border-border text-muted-foreground"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${open ? "bg-success" : "bg-muted-foreground/50"}`} />
                    {open ? "Available" : "Busy"}
                  </div>
                </div>

                {/* Bio */}
                {u.bio ? (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {u.bio}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 italic">No bio added yet.</p>
                )}

                {/* Skills */}
                {u.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {u.skills.slice(0, 5).map((s: any) => (
                      <span
                        key={s.id}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground transition-colors cursor-pointer hover:bg-accent ${
                          collabSkill === s.name ? "border-foreground/30 text-foreground bg-accent" : ""
                        }`}
                        onClick={() => setCollabSkill(collabSkill === s.name ? "" : s.name)}
                        title={`Filter by ${s.name}`}
                      >
                        {s.name}
                      </span>
                    ))}
                    {u.skills.length > 5 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                        +{u.skills.length - 5}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50 italic">No skills listed.</p>
                )}

                {/* Footer: running projects + actions */}
                <div className="flex items-center justify-between border-t border-border pt-3 mt-auto gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin size={10} strokeWidth={1.75} className="shrink-0" />
                    {openProjectCount > 0
                      ? `${openProjectCount} open project${openProjectCount > 1 ? "s" : ""}`
                      : "No active projects"}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Copy email */}
                    <button
                      onClick={() => copyEmail(u.id, u.email ?? "")}
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground"
                      title="Copy email address"
                      aria-label={`Copy ${u.name}'s email`}
                    >
                      {copiedId === u.id
                        ? <CheckCheck size={13} strokeWidth={2} className="text-success" />
                        : <Copy size={13} strokeWidth={1.75} />
                      }
                    </button>

                    {/* View profile */}
                    <Link
                      href={`/profile/${u.id}`}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-14 text-center">
          <div className="flex justify-center mb-3">
            <Users size={28} strokeWidth={1.5} className="text-muted-foreground/40" />
          </div>
          <p className="text-[14px] font-medium text-foreground mb-1">No people found</p>
          <p className="text-[12px] text-muted-foreground">
            Try clearing your filters or broadening your search.
          </p>
        </div>
      )}
    </div>
  );
}
