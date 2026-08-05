"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import OnboardingModal from "@/components/OnboardingModal";
import EditProjectModal from "@/components/EditProjectModal";
import CropImageModal from "@/components/CropImageModal";

// Lazy-loaded Tab Modules for faster client JS bundle
const ProjectsTab = dynamic(() => import("./tabs/ProjectsTab"));
const ApplicationsTab = dynamic(() => import("./tabs/ApplicationsTab"));
const NotificationsTab = dynamic(() => import("./tabs/NotificationsTab"));
const HomeTab = dynamic(() => import("./tabs/HomeTab"));
const CollaborationsFinderTab = dynamic(() => import("./tabs/CollaborationsFinderTab"));
const EventsTab = dynamic(() => import("./tabs/EventsTab"));
import {
  Check,
  X,
  Trash2,
  GitBranch,
  Link2,
  Mail,
  Send,
  UserPlus,
  Upload,
} from "lucide-react";
import { departments, getProjectIcon } from "@/lib/projects";
import { parseNameAndRollNumber, cn } from "@/lib/utils";

interface DashboardViewClientProps {
  activeTab: string;
  currentUser: any;
  projects: any[];
  applications: any[];
  notifications: any[];
  profileData: any;
  collaborations?: any[];
  collabPage?: number;
  collabLimit?: number;
  totalCollabs?: number;
  events?: any[];
  hackathons?: any[];
  recommendedProjects?: any[];
  receivedInvitations?: any[];
  sentInvitations?: any[];
  recentNotifications?: any[];
  leaderboardUsers?: any[];
}


export default function DashboardViewClient({
  activeTab,
  currentUser,
  projects: initialProjects,
  applications,
  notifications,
  profileData,
  collaborations = [],
  collabPage = 1,
  collabLimit = 24,
  totalCollabs = 0,
  events = [],
  hackathons = [],
  recommendedProjects = [],
  receivedInvitations = [],
  sentInvitations = [],
  recentNotifications = [],
  leaderboardUsers = [],
}: DashboardViewClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [nowMs] = useState(() => Date.now());
  const [projects, setProjects] = useState(initialProjects);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const [activeUser, setActiveUser] = useState(() => ({
    ...currentUser,
    ...profileData,
    name: profileData?.name || currentUser?.name || "",
    image: profileData?.profileImage || currentUser?.image || "",
  }));

  const [prevActiveUserProps, setPrevActiveUserProps] = useState({ currentUser, profileData });
  if (prevActiveUserProps.currentUser !== currentUser || prevActiveUserProps.profileData !== profileData) {
    setPrevActiveUserProps({ currentUser, profileData });
    setActiveUser((prev: any) => ({
      ...prev,
      ...currentUser,
      ...profileData,
      name: profileData?.name || currentUser?.name || prev?.name || "",
      image: profileData?.profileImage || currentUser?.image || prev?.image || "",
    }));
  }

  // Derive currentTab directly from prop — no effect needed
  const currentTab = activeTab || "home";

  const [profileName,     setProfileName]     = useState(() => {
    const rawName = profileData?.name || currentUser?.name || "";
    return parseNameAndRollNumber(rawName).name;
  });
  const [profileRollNumber, setProfileRollNumber] = useState(() => {
    const rawName = profileData?.name || currentUser?.name || "";
    return parseNameAndRollNumber(rawName).rollNumber;
  });

  const [prevUserRef, setPrevUserRef] = useState({ profileData, currentUser });
  if (prevUserRef.profileData !== profileData || prevUserRef.currentUser !== currentUser) {
    setPrevUserRef({ profileData, currentUser });
    const rawName = profileData?.name || currentUser?.name || "";
    const parsed = parseNameAndRollNumber(rawName);
    setProfileName(parsed.name);
    setProfileRollNumber(parsed.rollNumber);
  }

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

  const [actionError,   setActionError]   = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loadingId,     setLoadingId]     = useState<string | null>(null);

  // Clear messages on tab change
  useEffect(() => { setActionError(""); setActionSuccess(""); }, [activeTab]);

  const [collabSearch,  setCollabSearch]  = useState("");
  const [collabDept,    setCollabDept]    = useState("");
  const [collabSkill,   setCollabSkill]   = useState("");
  const [collabStatus,  setCollabStatus]  = useState<"all" | "open" | "busy">("all");
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
      setActionSuccess("Project marked as done! It will now appear on your completed projects.");
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
      const combinedName = profileRollNumber.trim()
        ? `${profileName.trim()} ${profileRollNumber.trim().toUpperCase()}`
        : profileName.trim();

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: combinedName,
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
      // Update activeUser state for immediate real-time rating updates across Leaderboard and Collaborators View
      const updatedSkills = profileSkills.split(",").map((s: string, i: number) => ({ id: i, name: s.trim() })).filter((s: { name: string }) => s.name);
      setActiveUser((prev: any) => ({
        ...prev,
        name: combinedName,
        department: profileDept,
        year: Number(profileYear),
        bio: profileBio,
        githubUrl: profileGithub,
        linkedinUrl: profileLinkedin,
        availability: profileAvailability,
        profileImage: profileImage,
        skills: updatedSkills,
      }));

      // Real-time Developer Reputation recalculation trigger
      if (currentUser?.id) {
        try {
          await fetch(`/api/reputation/${currentUser.id}`, { method: "POST" });
        } catch { /* fallback */ }
      }

      setActionSuccess("Profile & Developer Reputation updated in real time!");
      refresh();
    } catch (e: any) { setActionError(e.message); }
    finally { setLoadingId(null); }
  };


  const appStatusStyle = (s: string) => {
    if (s === "ACCEPTED") return "badge badge-green";
    if (s === "REJECTED") return "badge badge-red";
    return "badge badge-yellow";
  };

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex-1 p-4 sm:p-5 md:p-7 space-y-6">
      {actionError && (
        <Toast message={actionError} type="error" onClose={() => setActionError("")} />
      )}
      {actionSuccess && (
        <Toast message={actionSuccess} type="success" onClose={() => setActionSuccess("")} />
      )}

      {/* ── HOME / DASHBOARD COMBINED VIEW ────────────────────── */}
      {currentTab === "home" && (
        <HomeTab
          projects={projects}
          applications={applications}
          notifications={notifications}
          currentUser={activeUser}
          events={events}
          hackathons={hackathons}
          recommendedProjects={recommendedProjects}
          recentNotifications={recentNotifications}
          receivedInvitations={receivedNotifs}
          collaborations={collaborations}
          leaderboardUsers={leaderboardUsers}
          getProjectIcon={getProjectIcon}
          nowMs={nowMs}
          departments={departments}
        />
      )}

      {/* ── COLLABORATIONS — people finder ────────────────── */}
      {currentTab === "collaborations" && (
        <CollaborationsFinderTab
          people={collaborations}
          currentUser={activeUser}
          collabSearch={collabSearch}
          setCollabSearch={setCollabSearch}
          collabDept={collabDept}
          setCollabDept={setCollabDept}
          collabSkill={collabSkill}
          setCollabSkill={setCollabSkill}
          collabStatus={collabStatus}
          setCollabStatus={setCollabStatus}
          hasProjects={projects.length > 0}
          collabPage={collabPage}
          collabLimit={collabLimit}
          totalCollabs={totalCollabs}
          onInviteUser={(user: any) => {
            setInviteTargetUser(user);
            setInviteProjectId(projects[0]?.id?.toString() || "");
            setInviteModalOpen(true);
          }}
        />
      )}



      {/* ── EVENTS VIEW ─────────────────────────────────────── */}
      {(currentTab === "events" || currentTab === "hackathons") && (
        <EventsTab events={events} hackathons={hackathons} nowMs={nowMs} />
      )}

      {/* ── MY PROJECTS ───────────────────────────────────── */}
      {currentTab === "projects" && (
        <ProjectsTab
          projects={projects.filter((p: any) => Number(p.ownerId) === Number(activeUser?.id || currentUser?.id || profileData?.id))}
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
                            Invited by <strong className="text-foreground">{inv.sender?.name}</strong> ({inv.sender?.department}) · {new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
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
                          Project: <Link href={`/projects/${inv.project?.id}`} className="font-medium text-foreground hover:underline">{inv.project?.title}</Link> · Sent {new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Profile Settings</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Manage your account details, roll number, and public profile.</p>
            </div>
            
            {/* Desktop-only Save Button */}
            <div className="hidden lg:block">
              <button
                type="submit"
                form="profile-form"
                disabled={loadingId === "profile"}
                className="btn-primary text-[13px] py-2 px-6 font-bold cursor-pointer"
              >
                {loadingId === "profile" ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>

          <form id="profile-form" onSubmit={saveProfile} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Columns - Form Fields (Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Personal Information Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="text-[14px] font-bold text-foreground border-b border-border/60 pb-2 flex items-center gap-2">
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block section-label mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Christopher Noble"
                        className="forge-input"
                      />
                    </div>

                    <div>
                      <label className="block section-label mb-1.5">Roll Number</label>
                      <input
                        type="text"
                        value={profileRollNumber}
                        onChange={(e) => setProfileRollNumber(e.target.value)}
                        placeholder="e.g. URK24CS7001"
                        className="forge-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block section-label mb-1.5">Year of Study</label>
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
                  </div>
                </div>

                {/* 2. Professional Details Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="text-[14px] font-bold text-foreground border-b border-border/60 pb-2">
                    Professional Details
                  </h3>
                  
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
                </div>

                {/* 3. Social & Project Links Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="text-[14px] font-bold text-foreground border-b border-border/60 pb-2">
                    Social Connections
                  </h3>
                  
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
                </div>

                {/* Mobile-only Save button */}
                <div className="flex justify-center pt-2 lg:hidden">
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={loadingId === "profile"}
                    className="w-full sm:w-auto btn-primary text-[13px] py-2.5 px-8 font-bold cursor-pointer text-center"
                  >
                    {loadingId === "profile" ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Right Column - Avatar & Status Panel (Span 1) */}
              <div className="space-y-6">
                
                {/* Profile Picture Card */}
                <div className="card p-5 space-y-4 flex flex-col items-center text-center">
                  <h3 className="text-[13px] font-bold text-foreground border-b border-border/60 pb-2 w-full text-left">
                    Profile Picture
                  </h3>

                  <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-violet-500/30 bg-zinc-800 flex items-center justify-center shrink-0 shadow-md">
                    {profileImage ? (
                      <Image src={profileImage} alt="Profile" width={96} height={96} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <span className="text-3xl font-bold text-zinc-100">
                        {(profileName[0] || "?").toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 w-full">
                    <p className="text-[11px] text-zinc-400">Upload your avatar to Cloudinary.</p>
                    <label className="w-full btn-secondary text-[11px] py-2 px-3.5 inline-flex items-center justify-center gap-1.5 cursor-pointer font-medium rounded-lg hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200">
                      <Upload size={12} />
                      {uploadingImage ? "Uploading…" : "Upload Avatar"}
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

                {/* Availability Card */}
                <div className="card p-5 space-y-4">
                  <h3 className="text-[13px] font-bold text-foreground border-b border-border/60 pb-2 w-full">
                    Availability Status
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setProfileAvailability("AVAILABLE")}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-[12px] font-bold transition-all cursor-pointer",
                        profileAvailability === "AVAILABLE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-xs"
                          : "bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Available for Projects
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileAvailability("BUSY")}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-[12px] font-bold transition-all cursor-pointer",
                        profileAvailability === "BUSY"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-xs"
                          : "bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Busy / Not Available
                    </button>
                  </div>
                </div>

                {/* Danger Zone Card */}
                <div className="card p-5 border-destructive/20 bg-destructive/5 space-y-3">
                  <h4 className="text-[12px] font-bold text-destructive">Danger Zone</h4>
                  <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                    Permanently delete your account and all associated projects, applications, and data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full btn-ghost text-[11.5px] px-3.5 py-2 text-destructive hover:bg-destructive/15 border border-destructive/30 font-semibold rounded-lg shrink-0 cursor-pointer transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

            </div>
          </form>
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


