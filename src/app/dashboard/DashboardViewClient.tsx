"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import OnboardingModal from "@/components/OnboardingModal";
import EditProjectModal from "@/components/EditProjectModal";
import CropImageModal from "@/components/CropImageModal";
import { getNotificationLink } from "@/lib/notifications";

// Lazy-loaded Tab Modules for faster client JS bundle
const ProjectsTab = dynamic(() => import("./tabs/ProjectsTab"));
const BookmarksTab = dynamic(() => import("./tabs/BookmarksTab"));
const ApplicationsTab = dynamic(() => import("./tabs/ApplicationsTab"));
const NotificationsTab = dynamic(() => import("./tabs/NotificationsTab"));
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
  CheckCheck,
  Mail,
  Send,
  UserPlus,
  LucideIcon,
  CheckCircle2,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Upload
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
  events?: any[];
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
  const t = (title || "").toLowerCase();
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
  events = [],
  hackathons = [],
  recommendedProjects = [],
  receivedInvitations = [],
  sentInvitations = [],
  myProjectsSidebar = [],
  myApplicationsSidebar = [],
  recentNotifications = [],
}: DashboardViewClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [nowMs] = useState(() => Date.now());
  const [projects, setProjects] = useState(initialProjects);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Derive currentTab directly from prop — no effect needed
  const currentTab = activeTab || "home";

  const [eventFilter, setEventFilter] = useState<"all" | "active" | "ended">("active");

  const [dashSearch,   setDashSearch]   = useState("");
  const [dashCategory, setDashCategory] = useState("All");
  const [dashDept,     setDashDept]     = useState("");
  const [dashStatus,   setDashStatus]   = useState("ALL");
  const [dashPage,     setDashPage]     = useState(1);

  const [profileName,     setProfileName]     = useState(profileData?.name         || "");
  const [profileDept,     setProfileDept]     = useState(profileData?.department   || "");
  const [profileYear,     setProfileYear]     = useState(profileData?.year?.toString() || "");
  const [profileBio,      setProfileBio]      = useState(profileData?.bio          || "");
  const [profileGithub,   setProfileGithub]   = useState(profileData?.githubUrl    || "");
  const [profileLinkedin, setProfileLinkedin] = useState(profileData?.linkedinUrl  || "");
  const [profileSkills,   setProfileSkills]   = useState(
    profileData?.skills?.map((s: any) => s.name).join(", ") || ""
  );
  const [profileAvailability, setProfileAvailability] = useState<"AVAILABLE" | "BUSY">(
    profileData?.availability === "BUSY" ? "BUSY" : "AVAILABLE"
  );
  const [profileImage, setProfileImage] = useState<string>(
    profileData?.profileImage || currentUser?.image || ""
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedRawImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedUpload = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setActionError(""); setActionSuccess("");
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", croppedBlob, "profile-avatar.jpg");
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProfileImage(data.url);
        setActionSuccess("Cropped profile picture uploaded to Cloudinary!");
      } else {
        setActionError(data.error || "Failed to upload image.");
      }
    } catch {
      setActionError("Error uploading profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

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

  const markProjectDone = async (projectId: number) => {
    if (!confirm("Mark this project as Done? This will close it and show it as completed on your profile.")) return;
    setActionError(""); setActionSuccess(""); setLoadingId(`done-${projectId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setActionSuccess("Project marked as done! 🎉 It will now appear on your completed projects.");
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
          availability: profileAvailability,
          profileImage: profileImage,
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
    <div className="flex-1 p-4 sm:p-5 md:p-7 space-y-6">
      {actionError && (
        <div className="p-3 text-[12px] rounded-lg bg-destructive/10 text-destructive border border-destructive/20">{actionError}</div>
      )}
      {actionSuccess && (
        <div className="p-3 text-[12px] rounded-lg bg-success/10 text-green-700 dark:text-green-400 border border-success/20">{actionSuccess}</div>
      )}

      {/* ── HOME / DASHBOARD COMBINED VIEW ────────────────────── */}
      {currentTab === "home" && (() => {
        const eventsList = (events && events.length > 0) ? events : hackathons;
        const parseEventEndDate = (h: any): number | null => {
          const dateStr = h.endDate || h.date || h.startDate;
          if (!dateStr) return null;
          let endPart = dateStr;
          if (dateStr.includes(" - ")) endPart = dateStr.split(" - ").pop()!.trim();
          else if (dateStr.includes(" to ")) endPart = dateStr.split(" to ").pop()!.trim();
          else if (dateStr.includes("→")) endPart = dateStr.split("→").pop()!.trim();
          let d = new Date(endPart);
          if (isNaN(d.getTime())) d = new Date(`${endPart} ${new Date().getFullYear()}`);
          if (isNaN(d.getTime())) return null;
          if (!endPart.includes("T") && !endPart.includes(":")) d.setHours(23, 59, 59, 999);
          return d.getTime();
        };

        const activeEventsList = eventsList.filter((h: any) => {
          const endMs = parseEventEndDate(h);
          return endMs === null || endMs >= nowMs;
        });
        const topEvents = (activeEventsList.length > 0 ? activeEventsList : eventsList).slice(0, 4);

        const filteredProjects = projects.filter((p: any) => {
          if (dashSearch) {
            const q = dashSearch.toLowerCase();
            const matchTitle = (p.title || "").toLowerCase().includes(q);
            const matchDesc = (p.description || "").toLowerCase().includes(q);
            const matchCategory = (p.category || "").toLowerCase().includes(q);
            const matchSkill = p.skills?.some((s: any) => (s.name || "").toLowerCase().includes(q));
            if (!matchTitle && !matchDesc && !matchCategory && !matchSkill) return false;
          }
          if (dashCategory !== "All") {
            const cat = dashCategory.toLowerCase();
            const matchCat = (p.category || "").toLowerCase().includes(cat);
            const matchType = (p.projectType || "").toLowerCase().includes(cat);
            const matchSkill = p.skills?.some((s: any) => (s.name || "").toLowerCase().includes(cat));
            if (!matchCat && !matchType && !matchSkill) return false;
          }
          if (dashDept) {
            if ((p.owner?.department || "").toLowerCase() !== dashDept.toLowerCase()) return false;
          }
          if (dashStatus !== "ALL") {
            if (p.status !== dashStatus) return false;
          }
          return true;
        });

        const itemsPerPage = 8;
        const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
        const currentProjects = filteredProjects.slice((dashPage - 1) * itemsPerPage, dashPage * itemsPerPage);

        return (
          <div className="space-y-7">
            {/* ═════════════════════════════════════════════════════
               MOBILE VIEW — MATCHES USER SCREENSHOT (md:hidden)
               ═════════════════════════════════════════════════════ */}
            <div className="md:hidden space-y-6">
              {/* 1. Welcome Greeting + + New Project CTA Button */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-[17px] font-bold text-foreground tracking-tight leading-snug">
                    Welcome back, {(currentUser?.name || "USER").toUpperCase()} 👋
                  </h1>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">
                    Start by posting your first project and connecting with amazing collaborators.
                  </p>
                </div>
                <Link
                  href="/projects/create"
                  className="btn-primary text-[11px] py-2 px-3 rounded-xl shrink-0 flex items-center gap-1 font-semibold"
                >
                  <Plus size={13} strokeWidth={2} /> New Project
                </Link>
              </div>

              {/* 2. 4 Stat Cards Row */}
              <div className="grid grid-cols-4 gap-2">
                <Link href="/dashboard?tab=projects" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:border-muted-foreground/30 transition-all">
                  <div className="h-7 w-7 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
                    <Folder size={14} />
                  </div>
                  <span className="text-[15px] font-extrabold text-foreground leading-none">{projects.length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate w-full">My projects</span>
                </Link>

                <Link href="/dashboard?tab=applications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:border-muted-foreground/30 transition-all">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                    <Send size={14} />
                  </div>
                  <span className="text-[15px] font-extrabold text-foreground leading-none">{applications.length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate w-full">Applications</span>
                </Link>

                <Link href="/dashboard?tab=applications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:border-muted-foreground/30 transition-all">
                  <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                    <Bookmark size={14} />
                  </div>
                  <span className="text-[15px] font-extrabold text-foreground leading-none">{applications.filter((a: any) => a.status === "PENDING").length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate w-full">Pending</span>
                </Link>

                <Link href="/dashboard?tab=notifications" className="card p-2.5 flex flex-col items-center justify-center text-center space-y-1 hover:border-muted-foreground/30 transition-all">
                  <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                    <Users size={14} />
                  </div>
                  <span className="text-[15px] font-extrabold text-foreground leading-none">{recentNotifications.filter((n: any) => !n.read).length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate w-full">Unread</span>
                </Link>
              </div>

              {/* 3. Open to join Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-foreground">Open to join</h2>
                  <Link href="/projects" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                    View all →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {recommendedProjects && recommendedProjects.length > 0 ? (
                    recommendedProjects.slice(0, 3).map((project) => {
                      const iconInfo = getProjectIcon(project.title);
                      const Icon = iconInfo.icon;
                      const isBookmarked = bookmarkedIds.has(project.id);
                      return (
                        <article key={project.id} className="card p-3.5 flex items-start gap-3 hover:border-muted-foreground/30 transition-all">
                          <div className={`h-10 w-10 rounded-xl ${iconInfo.bg} border border-border flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon size={18} className={iconInfo.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-[13px] font-bold text-foreground leading-snug line-clamp-1">
                                <Link href={`/projects/${project.id}`}>{project.title}</Link>
                              </h3>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {project.status === "OPEN" && <span className="badge badge-green text-[9px] font-bold">OPEN</span>}
                                {project.status === "FULL" && <span className="badge badge-yellow text-[9px] font-bold">FULL</span>}
                                {project.status === "CLOSED" && <span className="badge badge-red text-[9px] font-bold">CLOSED</span>}
                                <button
                                  onClick={() => toggleBookmark(project.id)}
                                  className={`p-0.5 rounded transition-colors ${isBookmarked ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                                >
                                  <Bookmark size={12} className={isBookmarked ? "fill-foreground" : ""} />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
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
                              <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-tight font-medium">by {project.owner?.name}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="card p-6 text-center text-[12px] text-muted-foreground">No open projects right now.</div>
                  )}
                </div>
              </div>

              {/* 4. 2-Column Side-by-Side Cards (My projects & Applications) */}
              <div className="grid grid-cols-2 gap-3">
                {/* My projects card */}
                <div className="card p-4 flex flex-col justify-between space-y-3 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-foreground">My projects</h3>
                    <Link href="/projects/create" className="text-[10px] font-semibold text-primary hover:underline">+ New</Link>
                  </div>
                  {myProjectsSidebar && myProjectsSidebar.length > 0 ? (
                    <div className="space-y-2">
                      {myProjectsSidebar.slice(0, 2).map((proj) => (
                        <Link key={proj.id} href={`/projects/${proj.id}`} className="block text-[11px] font-medium text-foreground hover:underline truncate">
                          {proj.title}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-2">
                      <Folder size={24} className="mx-auto text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground leading-tight">No projects yet.<br />Create your first project.</p>
                      <Link href="/projects/create" className="btn-primary text-[10px] py-1 px-2.5 w-full block text-center rounded-lg font-bold">
                        Create Project
                      </Link>
                    </div>
                  )}
                </div>

                {/* Applications card */}
                <div className="card p-4 flex flex-col justify-between space-y-3 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-foreground">Applications</h3>
                    <Link href="/dashboard?tab=applications" className="text-[10px] font-semibold text-primary hover:underline">View all</Link>
                  </div>
                  {myApplicationsSidebar && myApplicationsSidebar.length > 0 ? (
                    <div className="space-y-2">
                      {myApplicationsSidebar.slice(0, 2).map((app) => (
                        <Link key={app.id} href={`/projects/${app.project.id}`} className="block text-[11px] font-medium text-foreground hover:underline truncate">
                          {app.project.title}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-2">
                      <Send size={24} className="mx-auto text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground leading-tight">No applications yet.<br />Browse and apply to exciting projects.</p>
                      <Link href="/projects" className="btn-primary text-[10px] py-1 px-2.5 w-full block text-center rounded-lg font-bold">
                        Browse Projects
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Recent activity Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-foreground">Recent activity</h2>
                  <Link href="/dashboard?tab=notifications" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                    View all →
                  </Link>
                </div>

                <div className="card divide-y divide-border/60 overflow-hidden">
                  {recentNotifications && recentNotifications.length > 0 ? (
                    recentNotifications.slice(0, 4).map((notif) => (
                      <Link
                        key={notif.id}
                        href={getNotificationLink(notif)}
                        className="flex items-center gap-3 px-3.5 py-3 hover:bg-secondary/30 transition-colors"
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${notif.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                        <p className="text-[11px] text-foreground flex-1 truncate leading-snug">{notif.message}</p>
                        <span className="text-[9.5px] text-muted-foreground shrink-0 font-medium ml-1">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-5 text-[11px] text-muted-foreground text-center">No recent activity.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
               DESKTOP VIEW — PC UNIFIED LAYOUT (hidden md:block)
               ═════════════════════════════════════════════════════ */}
            <div className="hidden md:block space-y-7">
              {/* ROW 1: Search Bar (Left) + Stat Cards (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={dashSearch}
                  onChange={(e) => { setDashSearch(e.target.value); setDashPage(1); }}
                  placeholder="Search projects, technologies, teammates..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground pointer-events-none">
                  Ctrl + K
                </span>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="card px-3.5 py-2.5 flex items-center gap-3 border-border">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Folder size={16} />
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-foreground leading-none">{projects.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total Projects</p>
                  </div>
                </div>

                <div className="card px-3.5 py-2.5 flex items-center gap-3 border-border">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-foreground leading-none">{projects.filter((p: any) => p.status === "OPEN").length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Open Projects</p>
                  </div>
                </div>

                <div className="card px-3.5 py-2.5 flex items-center gap-3 border-border">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-foreground leading-none">{applications.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Applications</p>
                  </div>
                </div>

                <div className="card px-3.5 py-2.5 flex items-center gap-3 border-border">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-foreground leading-none">{eventsList.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Hackathons</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Top Events & Competitions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h2 className="text-[15px] font-bold text-foreground tracking-tight">Top Events &amp; Competitions</h2>
                </div>
                <Link href="/dashboard?tab=events" className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1">
                  View all events →
                </Link>
              </div>

              {topEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topEvents.map((h: any) => {
                    const locationStr = [h.location, h.city, h.state, h.country].filter(Boolean).join(", ") || h.location || "Online";
                    return (
                      <div key={h.id} className="card p-4 space-y-3 flex flex-col justify-between border-border transition-all hover:border-primary/40">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {h.organizerType || "HACKATHON"}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-bold text-foreground line-clamp-1 leading-snug">{h.title}</h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{h.description}</p>
                          <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
                            <div>📅 {h.startDate ? `${h.startDate}${h.endDate ? ` → ${h.endDate}` : ''}` : (h.date || "TBA")}</div>
                            <div>📍 {locationStr}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                          <div>
                            <span className="text-muted-foreground block text-[9px]">Prize Pool</span>
                            <span className="font-bold text-foreground">{h.prize || "TBA"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground block text-[9px]">Team Size</span>
                            <span className="font-bold text-foreground">{h.teamSize || "1-4 Members"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card p-6 text-center text-[12px] text-muted-foreground">No upcoming events right now.</div>
              )}
            </div>

            {/* ROW 3: Filter Toolbar (Category Pills + Dropdowns) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {["All", "AI", "Web", "IoT", "Robotics", "Research", "Hackathon", "Productivity", "Design"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setDashCategory(cat); setDashPage(1); }}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      dashCategory === cat
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2 overflow-x-auto shrink-0">
                <select
                  value={dashDept}
                  onChange={(e) => { setDashDept(e.target.value); setDashPage(1); }}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="">Department ▾</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={dashStatus}
                  onChange={(e) => { setDashStatus(e.target.value); setDashPage(1); }}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="ALL">Status ▾</option>
                  <option value="OPEN">Open</option>
                  <option value="FULL">Full</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* ROW 4: Projects Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-foreground">{filteredProjects.length} Projects Found</h3>
              </div>

              {currentProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentProjects.map((project: any) => {
                    const isBookmarked = bookmarkedIds.has(project.id);
                    return (
                      <div key={project.id} className="card p-4 space-y-3 flex flex-col justify-between border-border transition-all hover:border-primary/40">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            {project.status === "OPEN" && (
                              <span className="badge badge-green text-[9px] font-bold">OPEN</span>
                            )}
                            {project.status === "FULL" && (
                              <span className="badge badge-yellow text-[9px] font-bold">FULL</span>
                            )}
                            {project.status === "CLOSED" && (
                              <span className="badge badge-red text-[9px] font-bold">CLOSED</span>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                              <button
                                onClick={() => toggleBookmark(project.id)}
                                className={`p-0.5 rounded transition-colors cursor-pointer ${isBookmarked ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                              >
                                <Bookmark size={13} className={isBookmarked ? "fill-foreground" : ""} />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-[13px] font-bold text-foreground leading-snug line-clamp-1 hover:underline">
                            <Link href={`/projects/${project.id}`}>{project.title}</Link>
                          </h4>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {project.skills?.slice(0, 3).map((skill: any) => (
                              <span key={skill.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[9px] shrink-0">
                              {(project.owner?.name?.[0] || "U").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-foreground truncate">{project.owner?.name || "Student"}</p>
                              <p className="text-[8px] text-muted-foreground truncate">{project.owner?.department || "Campus"}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-[9px] font-bold text-foreground">{project.teamSize ? `1/${project.teamSize}` : "Team"}</p>
                            <p className="text-[8px] text-muted-foreground">Members</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card p-8 text-center text-[12px] text-muted-foreground">No projects match the selected filters.</div>
              )}
            </div>

            {/* ROW 5: Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4">
                <button
                  onClick={() => setDashPage(p => Math.max(1, p - 1))}
                  disabled={dashPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setDashPage(pNum)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      dashPage === pNum
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  onClick={() => setDashPage(p => Math.min(totalPages, p + 1))}
                  disabled={dashPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold disabled:opacity-40 hover:bg-secondary cursor-pointer"
                >
                  ›
                </button>
              </div>
            )}
            </div>{/* end hidden md:block desktop view */}
          </div>
        );
      })()}


      {/* ── COLLABORATIONS — people finder ────────────────── */}
      {currentTab === "collaborations" && (
        <CollaborationsFinder
          people={collaborations}
          currentUser={currentUser}
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



      {/* ── EVENTS VIEW ─────────────────────────────────────── */}
      {(currentTab === "events" || currentTab === "hackathons") && (() => {
        const eventsList = (events && events.length > 0) ? events : hackathons;

        const parseEventEndDate = (h: any): number | null => {
          const dateStr = h.endDate || h.date || h.startDate;
          if (!dateStr) return null;

          let endPart = dateStr;
          if (dateStr.includes(" - ")) {
            endPart = dateStr.split(" - ").pop()!.trim();
          } else if (dateStr.includes(" to ")) {
            endPart = dateStr.split(" to ").pop()!.trim();
          } else if (dateStr.includes("→")) {
            endPart = dateStr.split("→").pop()!.trim();
          }

          let d = new Date(endPart);
          if (isNaN(d.getTime())) {
            d = new Date(`${endPart} ${new Date().getFullYear()}`);
          }
          if (isNaN(d.getTime())) return null;

          if (!endPart.includes("T") && !endPart.includes(":")) {
            d.setHours(23, 59, 59, 999);
          }
          return d.getTime();
        };

        const activeEvents = eventsList.filter((h: any) => {
          const endMs = parseEventEndDate(h);
          if (endMs === null) return true;
          return endMs >= nowMs;
        });

        const endedEvents = eventsList.filter((h: any) => {
          const endMs = parseEventEndDate(h);
          if (endMs === null) return false;
          return endMs < nowMs;
        });

        const displayEvents = eventFilter === "active" ? activeEvents : (eventFilter === "ended" ? endedEvents : eventsList);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-bold text-foreground tracking-tight">Events &amp; Competitions</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Explore hackathons, hiring challenges, and tech events from top platforms &amp; universities.</p>
              </div>

              {/* Sub-filters for Active vs Ended */}
              <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEventFilter("active")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    eventFilter === "active"
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upcoming &amp; Live ({activeEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter("ended")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    eventFilter === "ended"
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Past Events ({endedEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter("all")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    eventFilter === "all"
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({eventsList.length})
                </button>
              </div>
            </div>

            {displayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayEvents.map((h: any) => {
                  const endMs = parseEventEndDate(h);
                  const isEnded = endMs !== null && endMs < nowMs;
                  const locationStr = [h.location, h.city, h.state, h.country].filter(Boolean).join(", ") || h.location || "Online";

                  return (
                    <div
                      key={h.id}
                      className={`card p-5 space-y-4 flex flex-col justify-between border-border relative transition-all hover:border-primary/40 ${
                        isEnded ? "opacity-75 bg-card/60" : ""
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0 text-[18px]">
                              🏆
                            </div>
                            <div>
                              <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-1">{h.title}</h3>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {h.organizer && (
                                  <span className="text-[11px] font-semibold text-foreground/90">{h.organizer}</span>
                                )}
                                {h.organizerType && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                                    {h.organizerType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {isEnded ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border shrink-0">
                              Ended
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                              Live / Upcoming
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
                          {h.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                          <div>
                            <span className="text-foreground font-semibold">📅 Dates:</span>{" "}
                            {h.startDate
                              ? `${h.startDate}${h.endDate ? ` → ${h.endDate}` : ""}`
                              : (h.date || "TBA")}
                          </div>
                          <div>
                            <span className="text-foreground font-semibold">📍 Venue:</span> {locationStr}
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
                            <div className="col-span-2 text-amber-500 font-semibold line-clamp-1">
                              🏆 Prize Pool: {h.prize}
                            </div>
                          )}
                          {h.source && (
                            <div className="col-span-2 text-[10px] text-muted-foreground/80">
                              Source: {h.source}
                            </div>
                          )}
                        </div>
                      </div>

                      {h.link ? (
                        <div className="border-t border-border pt-3">
                          <a
                            href={h.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full justify-center text-[12px] py-2 flex items-center gap-1.5 font-bold transition-all rounded-lg ${
                              isEnded
                                ? "btn-secondary text-muted-foreground hover:text-foreground opacity-80"
                                : "btn-primary"
                            }`}
                          >
                            {isEnded ? "View Event Page ↗" : "Register Now ↗"}
                          </a>
                        </div>
                      ) : (
                        <div className="border-t border-border pt-3">
                          <span className="text-[11px] text-muted-foreground italic">Registration opens soon</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-12 text-center space-y-2">
                <Trophy size={32} className="mx-auto text-muted-foreground/40" />
                <p className="text-[14px] font-medium text-foreground">
                  {eventFilter === "active" ? "No upcoming events right now" : "No events found"}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {eventFilter === "active"
                    ? "Check back soon for new hackathons and competitions, or view past events."
                    : "Try switching filters to view upcoming or past events."}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── BOOKMARKS ─────────────────────────────────────── */}
      {currentTab === "bookmarks" && (
        <BookmarksTab bookmarks={bookmarks} getProjectIcon={getProjectIcon} />
      )}

      {/* ── MY PROJECTS ───────────────────────────────────── */}
      {currentTab === "projects" && (
        <ProjectsTab
          projects={projects}
          loadingId={loadingId}
          setEditingProject={setEditingProject}
          statusToggle={statusToggle}
          markProjectDone={markProjectDone}
          deleteProject={deleteProject}
          applicationAction={applicationAction}
          appStatusStyle={appStatusStyle}
        />
      )}

      {/* ── MY APPLICATIONS ───────────────────────────────── */}
      {currentTab === "applications" && (
        <ApplicationsTab applications={applications} appStatusStyle={appStatusStyle} />
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
        <NotificationsTab
          localNotifications={localNotifications}
          markAllRead={markAllRead}
          markNotifRead={markNotifRead}
        />
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
              {/* Cloudinary Profile Picture Upload */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/30 bg-secondary flex items-center justify-center shrink-0 shadow-sm">
                  {profileImage ? (
                    <Image src={profileImage} alt="Profile" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xl font-bold text-foreground">
                      {(profileName[0] || "?").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-[13px] font-semibold text-foreground">Profile Picture (Cloudinary)</label>
                  <p className="text-[11px] text-muted-foreground">Upload your avatar to Cloudinary.</p>
                  <div className="pt-1">
                    <label className="btn-secondary text-[11px] py-1.5 px-3.5 inline-flex items-center gap-1.5 cursor-pointer font-medium hover:bg-secondary">
                      <Upload size={12} />
                      {uploadingImage ? "Uploading to Cloudinary…" : "Upload Picture"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

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

              {/* Availability Status Toggle */}
              <div>
                <label className="block section-label mb-1.5">Availability Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileAvailability("AVAILABLE")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
                      profileAvailability === "AVAILABLE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Available for Projects
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileAvailability("BUSY")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
                      profileAvailability === "BUSY"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Busy / Not Available
                  </button>
                </div>
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

      {/* Profile Picture Crop Modal */}
      {isCropperOpen && selectedRawImage && (
        <CropImageModal
          isOpen={isCropperOpen}
          imageSrc={selectedRawImage}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCroppedUpload}
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
  onInviteUser?: (user: any) => void;
}

function CollaborationsFinder({
  people,
  currentUser,
  collabSearch, setCollabSearch,
  collabDept,   setCollabDept,
  collabSkill,  setCollabSkill,
  collabStatus, setCollabStatus,
  hasProjects = false,
  onInviteUser,
}: CFProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // "open to collaborate" = user explicitly set availability OR has no currently-OPEN project they own
  const isOpenToWork = (u: any) => {
    if (u.availability === "BUSY") return false;
    if (u.availability === "AVAILABLE") return true;
    return !(u.projects || []).some((p: any) => p.status === "OPEN");
  };

  // Unique department list from the data
  const allDepts = Array.from(
    new Set(people.map((u: any) => u.department as string).filter(Boolean))
  ).sort();

  // Unique skill list from the data
  const allSkills = Array.from(
    new Set(people.flatMap((u: any) => (u.skills || []).map((s: any) => s?.name as string).filter(Boolean)))
  ).sort();

  // Filter logic
  const filtered = people.filter((u: any) => {
    const q = collabSearch.trim().toLowerCase();
    if (
      q &&
      !(u.name || "").toLowerCase().includes(q) &&
      !(u.email || "").toLowerCase().includes(q) &&
      !(u.department || "").toLowerCase().includes(q) &&
      !(u.bio ?? "").toLowerCase().includes(q) &&
      !(u.skills || []).some((s: any) => (s?.name || "").toLowerCase().includes(q))
    ) return false;
    if (collabDept && u.department !== collabDept) return false;
    if (collabSkill && !(u.skills || []).some((s: any) => s?.name === collabSkill)) return false;
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

  const selectBg = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 8px center",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Find collaborators
              <Users size={20} className="text-indigo-400" />
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-semibold border border-border">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Connect with verified students across campus and build project teams.
          </p>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="relative block sm:hidden">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={collabSearch}
          onChange={(e) => setCollabSearch(e.target.value)}
          placeholder="Search by name, skill, department..."
          className="forge-input pl-10 pr-9 py-2.5 w-full bg-card rounded-xl text-xs"
        />
        {collabSearch && (
          <button
            onClick={() => setCollabSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter Toolbar (Matching Image 1 Desktop & Image 2 Mobile) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-secondary/30 rounded-2xl border border-border/80">
        {/* Availability Toggle Pills: All / Available / Busy */}
        <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border/60">
          <button
            onClick={() => setCollabStatus("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "all"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            All
          </button>

          <button
            onClick={() => setCollabStatus("open")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "open"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Available
          </button>

          <button
            onClick={() => setCollabStatus("busy")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collabStatus === "busy"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Busy
          </button>
        </div>

        {/* Right Select Filters & Sliders icon */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Desktop Search input */}
          <div className="relative hidden sm:block w-48 lg:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={collabSearch}
              onChange={(e) => setCollabSearch(e.target.value)}
              placeholder="Search..."
              className="forge-input pl-8 pr-7 py-1.5 w-full bg-card rounded-lg text-xs"
            />
            {collabSearch && (
              <button onClick={() => setCollabSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={11} />
              </button>
            )}
          </div>

          <select
            value={collabDept}
            onChange={(e) => setCollabDept(e.target.value)}
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option value="">Departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={collabSkill}
            onChange={(e) => setCollabSkill(e.target.value)}
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option value="">Skills</option>
            {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="text-xs py-1.5 pl-3 pr-7 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer hover:bg-secondary/50 transition-colors appearance-none truncate"
            style={selectBg}
          >
            <option>Sort by: Recommended</option>
            <option>Newest First</option>
            <option>Highest Rated</option>
          </select>

          <button className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground cursor-pointer">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Active filter pills */}
      {(collabDept || collabSkill || collabSearch || collabStatus !== "all") && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground font-medium mr-1">Active filters:</span>
          {collabDept && (
            <button
              onClick={() => setCollabDept("")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary"
            >
              Dept: {collabDept} <X size={11} />
            </button>
          )}
          {collabSkill && (
            <button
              onClick={() => setCollabSkill("")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary"
            >
              Skill: {collabSkill} <X size={11} />
            </button>
          )}
          {collabStatus !== "all" && (
            <button
              onClick={() => setCollabStatus("all")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-card text-foreground border border-border hover:bg-secondary"
            >
              Status: {collabStatus === "open" ? "Available" : "Busy"} <X size={11} />
            </button>
          )}
          <button
            onClick={() => {
              setCollabSearch("");
              setCollabDept("");
              setCollabSkill("");
              setCollabStatus("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-auto cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Collaborators Card Grid (Matching Reference Layout) */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
          {filtered.map((u: any) => {
            const open = isOpenToWork(u);
            const displayName = u.name || u.email?.split("@")[0] || "Student";
            const initial = (displayName[0] || "?").toUpperCase();
            const projectCount = (u.projects || []).length;
            const collabCount = (u.applications || []).filter((a: any) => a.status === "ACCEPTED").length;
            const lookingForText = u.bio || (u.department ? `${u.department} Projects, AI Hackathons` : "Web & Full Stack Projects");

            return (
              <div
                key={u.id}
                className="card p-5 space-y-4 border border-border/80 bg-card rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all duration-200 shadow-xs group relative"
              >
                {/* Top Row: Avatar + Status Badge & Action Menu */}
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar Circle with Online Dot */}
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center font-bold text-lg text-foreground shrink-0 overflow-hidden shadow-xs">
                      {u.profileImage ? (
                        <Image src={u.profileImage} alt={displayName} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        initial
                      )}
                    </div>
                    {/* Status Dot */}
                    <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${open ? "bg-emerald-500" : "bg-amber-500"}`} />
                  </div>

                  {/* Status Pill Badge + Action Dots */}
                  <div className="flex items-center gap-1">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border ${
                      open
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    }`}>
                      {open ? "Available" : "Busy"}
                    </span>
                    <button className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>

                {/* Name & Academic Year */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/profile/${u.id}`} className="text-[15px] font-bold text-foreground hover:underline truncate">
                      {displayName}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Year {u.year || 2} • {u.department || "CSE"}
                  </p>
                </div>

                {/* Skill Tag Badges */}
                {u.skills && u.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {u.skills.slice(0, 3).map((s: any) => (
                      <span
                        key={s.id}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/80 text-foreground border border-border/60 hover:border-primary/40 cursor-pointer transition-colors"
                        onClick={() => setCollabSkill(collabSkill === s.name ? "" : s.name)}
                      >
                        {s.name}
                      </span>
                    ))}
                    {u.skills.length > 3 && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border/60">
                        +{u.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Looking For Line */}
                <div className="text-[11.5px] text-muted-foreground line-clamp-1">
                  <span className="font-semibold text-foreground/80">Looking for: </span>
                  {lookingForText}
                </div>

                {/* Stats 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/60 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-foreground">
                      <Folder size={11} className="text-muted-foreground" />
                      {projectCount}
                    </div>
                    <div className="text-[9.5px] text-muted-foreground font-medium">Projects</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-foreground">
                      <Users size={11} className="text-muted-foreground" />
                      {collabCount}
                    </div>
                    <div className="text-[9.5px] text-muted-foreground font-medium">Collaborations</div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/profile/${u.id}`}
                    className="btn-secondary text-[11.5px] py-2 px-3 justify-center rounded-xl font-semibold border border-border hover:bg-secondary text-center"
                  >
                    View Profile
                  </Link>
                  {u.id !== currentUser?.id && hasProjects && onInviteUser ? (
                    <button
                      type="button"
                      onClick={() => onInviteUser(u)}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] py-2 px-3 justify-center rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send size={12} /> Invite
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyEmail(u.id, u.email ?? "")}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] py-2 px-3 justify-center rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {copiedId === u.id ? <CheckCheck size={12} /> : <Send size={12} />}
                      {copiedId === u.id ? "Copied!" : "Invite"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-14 text-center border border-border bg-card rounded-2xl space-y-2">
          <Users size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-base font-bold text-foreground">No collaborators found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      )}

      {/* Pagination Footer (Matching Reference Image 1) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/80">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white">1</button>
          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card text-muted-foreground hover:text-foreground border border-border cursor-pointer">2</button>
          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card text-muted-foreground hover:text-foreground border border-border cursor-pointer">3</button>
          <span className="px-2 text-muted-foreground text-xs font-semibold">...</span>
          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card text-muted-foreground hover:text-foreground border border-border cursor-pointer">9</button>
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <select className="bg-card border border-border rounded-lg text-foreground px-3 py-1.5 font-medium appearance-none cursor-pointer" style={selectBg}>
            <option>12 per page</option>
            <option>24 per page</option>
            <option>48 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
