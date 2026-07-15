"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiGrid,
  FiCheck,
  FiX,
  FiUser,
  FiGithub,
  FiLinkedin,
  FiTrash2,
} from "react-icons/fi";

interface DashboardViewClientProps {
  activeTab: string;
  currentUser: any;
  projects: any[];
  applications: any[];
  notifications: any[];
  profileData: any;
  adminData?: {
    users: any[];
    projects: any[];
  };
}

export default function DashboardViewClient({
  activeTab,
  currentUser,
  projects,
  applications,
  notifications,
  profileData,
  adminData,
}: DashboardViewClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Profile Form States
  const [profileName, setProfileName] = useState(profileData?.name || "");
  const [profileDept, setProfileDept] = useState(profileData?.department || "");
  const [profileYear, setProfileYear] = useState(profileData?.year?.toString() || "");
  const [profileBio, setProfileBio] = useState(profileData?.bio || "");
  const [profileGithub, setProfileGithub] = useState(profileData?.githubUrl || "");
  const [profileLinkedin, setProfileLinkedin] = useState(profileData?.linkedinUrl || "");
  const [profileSkills, setProfileSkills] = useState(
    profileData?.skills?.map((s: any) => s.name).join(", ") || ""
  );

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusToggle = async (projectId: number, currentStatus: string) => {
    setActionError("");
    setActionSuccess("");
    const nextStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    setLoadingId(`status-${projectId}`);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project status.");
      }

      setActionSuccess(`Project status updated to ${nextStatus}.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleProjectDelete = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project? This action is irreversible.")) return;

    setActionError("");
    setActionSuccess("");
    setLoadingId(`delete-${projectId}`);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project.");
      }

      setActionSuccess("Project deleted successfully.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleApplicationAction = async (applicationId: number, status: "ACCEPTED" | "REJECTED") => {
    setActionError("");
    setActionSuccess("");
    setLoadingId(`app-${applicationId}`);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update application.");
      }

      setActionSuccess(`Application ${status.toLowerCase()} successfully.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    setLoadingId("profile-save");

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
          skills: profileSkills
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile.");
      }

      setActionSuccess("Profile updated successfully.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAdminDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to ban/delete this user? All their projects and applications will be deleted.")) return;

    setActionError("");
    setActionSuccess("");
    setLoadingId(`user-delete-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user.");
      }

      setActionSuccess("User account deleted successfully.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      case "REJECTED":
        return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
      default:
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
    }
  };

  const departmentsList = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Food Processing Technology"
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      {actionError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {actionError}
        </div>
      )}

      {actionError && (
        <div className="p-3.5 notion-tag-red border border-rose-200/20 rounded-lg text-xs">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 notion-tag-green border border-green-200/20 rounded-lg text-xs">
          {actionSuccess}
        </div>
      )}

      {/* 1. MY PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">My Managed Projects</h2>
            <p className="text-xs text-muted-foreground">Manage recruitment status and accept student applications.</p>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="glass-panel rounded-lg border border-border overflow-hidden bg-card">
                  {/* Project Header */}
                  <div className="p-5 border-b border-border bg-muted/20 sm:flex sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1 hover:underline">
                        <Link href={`/projects/${project.id}`}>{project.title}</Link>
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          project.status === "OPEN"
                            ? "notion-tag-green"
                            : "notion-tag-red"
                        }`}>
                          {project.status}
                        </span>
                        <span>•</span>
                        <span>{project.applications.length} applications received</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button
                        onClick={() => handleStatusToggle(project.id, project.status)}
                        disabled={loadingId !== null}
                        className="px-3 py-1.5 text-xs font-semibold bg-secondary text-foreground hover:bg-muted border border-border rounded-lg transition-colors cursor-pointer"
                      >
                        {loadingId === `status-${project.id}`
                          ? "Updating..."
                          : project.status === "OPEN"
                          ? "Close recruitment"
                          : "Open recruitment"}
                      </button>
                      <button
                        onClick={() => handleProjectDelete(project.id)}
                        disabled={loadingId !== null}
                        className="p-1.5 text-xs font-semibold text-destructive hover:bg-rose-950/20 border border-transparent rounded-lg transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Applications received for this project */}
                  <div className="p-5 space-y-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Applications Received
                    </h4>

                    {project.applications.length > 0 ? (
                      <div className="divide-y divide-border">
                        {project.applications.map((app: any) => (
                          <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-2 max-w-xl">
                              <div className="flex items-center gap-2">
                                <Link href={`/profile/${app.user.id}`} className="font-bold text-sm text-foreground hover:underline">{app.user.name}</Link>
                                <span className="text-xs text-muted-foreground">
                                  ({app.user.department} • Yr {app.user.year})
                                </span>
                              </div>
                              <p className="text-xs text-foreground whitespace-pre-wrap bg-secondary p-3 rounded-lg leading-relaxed border border-border/40">
                                {app.message || "No motivation message provided."}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                              {app.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => handleApplicationAction(app.id, "ACCEPTED")}
                                    disabled={loadingId !== null}
                                    className="px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-opacity-90 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <FiCheck /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleApplicationAction(app.id, "REJECTED")}
                                    disabled={loadingId !== null}
                                    className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <FiX /> Decline
                                  </button>
                                </>
                              ) : (
                                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase ${getApplicationStatusColor(app.status)}`}>
                                  {app.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/80 italic py-2">
                        No applications received yet for this project.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-lg text-center border border-border bg-card">
              <p className="text-sm text-muted-foreground">You haven&apos;t posted any projects yet.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. MY APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">My Collaboration Requests</h2>
            <p className="text-xs text-muted-foreground">Track the status of your applications to join other projects.</p>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="glass-panel p-5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground hover:underline">
                      <a href={`/projects/${app.project.id}`}>{app.project.title}</a>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Owner: <Link href={`/profile/${app.project.owner.id}`} className="hover:underline text-foreground font-semibold">{app.project.owner.name}</Link> • Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    {app.message && (
                      <p className="text-xs text-foreground bg-secondary p-2.5 rounded-lg border border-border/40 mt-2 leading-relaxed">
                        Message: &quot;{app.message}&quot;
                      </p>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded uppercase shrink-0 self-start sm:self-center ${getApplicationStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-lg text-center border border-border bg-card">
              <p className="text-sm text-muted-foreground">You haven&apos;t applied to any projects yet.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Inbox & Notifications</h2>
              <p className="text-xs text-muted-foreground">Stay updated on your application status changes.</p>
            </div>

            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllNotificationsRead}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                  className={`p-4 rounded-lg border transition-all bg-card ${
                    notif.read
                      ? "border-border/50 opacity-60"
                      : "border-border hover:border-muted-foreground/30 cursor-pointer shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs text-foreground leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-lg text-center border border-border bg-card">
              <p className="text-sm text-muted-foreground">No notifications received.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. PROFILE SETTINGS TAB */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Profile Settings</h2>
            <p className="text-xs text-muted-foreground">Manage your student metadata and technical portfolio.</p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-lg border border-border bg-card">
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 font-mono">Verified Email</label>
                  <input
                    type="text"
                    disabled
                    value={profileData?.email || ""}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-muted-foreground/70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Department</label>
                  <select
                    required
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-secondary"
                  >
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Year of Study</label>
                  <select
                    required
                    value={profileYear}
                    onChange={(e) => setProfileYear(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-secondary"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Short Bio</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="I am passionate about IoT sensors..."
                  className="w-full p-2.5 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Technical Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="React, Next.js, Node.js, Python, Arduino"
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                    <FiGithub /> Github Link
                  </label>
                  <input
                    type="url"
                    value={profileGithub}
                    onChange={(e) => setProfileGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                    <FiLinkedin /> LinkedIn Link
                  </label>
                  <input
                    type="url"
                    value={profileLinkedin}
                    onChange={(e) => setProfileLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingId !== null}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-opacity-90 rounded-lg transition-colors cursor-pointer"
              >
                {loadingId === "profile-save" ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADMIN CONSOLE TAB */}
      {activeTab === "admin" && currentUser.role === "ADMIN" && adminData && (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Admin Management Center</h2>
            <p className="text-xs text-muted-foreground font-medium">Moderate student listings and delete flagged content.</p>
          </div>

          {/* User management */}
          <div className="glass-panel p-5 rounded-lg border border-border bg-card space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FiUser className="text-muted-foreground" />
              Registered Accounts ({adminData.users.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-border">
                <thead>
                  <tr className="text-muted-foreground text-xs font-semibold uppercase">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {adminData.users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-2 font-bold text-foreground hover:underline"><Link href={`/profile/${u.id}`}>{u.name}</Link></td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          u.role === "ADMIN"
                            ? "notion-tag-yellow"
                            : "notion-tag-gray"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          u.verified ? "notion-tag-green" : "notion-tag-yellow"
                        }`}>
                          {u.verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {u.role !== "ADMIN" && (
                           <button
                            onClick={() => handleAdminDeleteUser(u.id)}
                            disabled={loadingId !== null}
                            className="text-destructive hover:text-red-400 font-semibold cursor-pointer text-[11px]"
                          >
                            {loadingId === `user-delete-${u.id}` ? "Deleting..." : "Ban / Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project moderation */}
          <div className="glass-panel p-5 rounded-lg border border-border bg-card space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FiGrid className="text-muted-foreground" />
              Published Projects ({adminData.projects.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-border">
                <thead>
                  <tr className="text-muted-foreground text-xs font-semibold uppercase">
                    <th className="py-3 px-2">Project</th>
                    <th className="py-3 px-2">Owner</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {adminData.projects.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-2 font-bold text-foreground hover:underline">
                        <a href={`/projects/${p.id}`}>{p.title}</a>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{p.owner.name}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          p.status === "OPEN"
                            ? "notion-tag-green"
                            : "notion-tag-red"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleProjectDelete(p.id)}
                          disabled={loadingId !== null}
                          className="text-destructive hover:text-red-400 font-semibold cursor-pointer text-[11px]"
                        >
                          {loadingId === `delete-${p.id}` ? "Deleting..." : "Force Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
