"use client";

import Link from "next/link";
import { Pencil, CheckCheck, Trash2, Check, X } from "lucide-react";

interface ProjectsTabProps {
  projects: any[];
  loadingId: string | null;
  setEditingProject: (project: any) => void;
  statusToggle: (projectId: number, currentStatus: string) => void;
  markProjectDone: (projectId: number) => void;
  deleteProject: (projectId: number) => void;
  applicationAction: (appId: number, status: "ACCEPTED" | "REJECTED") => void;
  appStatusStyle: (status: string) => string;
}

export default function ProjectsTab({
  projects,
  loadingId,
  setEditingProject,
  statusToggle,
  markProjectDone,
  deleteProject,
  applicationAction,
  appStatusStyle,
}: ProjectsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-textPrimary tracking-tight">My projects</h2>
          <p className="text-[12px] text-textMuted mt-0.5">Manage recruitment and review applications.</p>
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
                    <h3 className="text-[14px] font-semibold text-textPrimary">
                      <Link href={`/projects/${project.id}`} className="hover:underline underline-offset-2">
                        {project.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={
                        project.status === "OPEN" ? "badge badge-green" :
                        project.status === "DONE" ? "badge badge-green" :
                        "badge badge-red"
                      }>
                        {project.status === "DONE" ? "✓ Done" : project.status}
                      </span>
                      <span className="text-[11px] text-textMuted">
                        {project.applications.length} application{project.applications.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setEditingProject(project)}
                    className="btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                    title="Edit project details"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  {project.status !== "DONE" && (
                    <>
                      <button
                        onClick={() => statusToggle(project.id, project.status)}
                        disabled={loadingId !== null}
                        className="btn-secondary text-[12px] py-1.5 px-3 cursor-pointer"
                      >
                        {loadingId === `status-${project.id}` ? "…" : project.status === "OPEN" ? "Close" : "Reopen"}
                      </button>
                      <button
                        onClick={() => markProjectDone(project.id)}
                        disabled={loadingId !== null}
                        className="btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                        title="Mark this project as completed"
                      >
                        <CheckCheck size={13} />
                        Mark Done
                      </button>
                    </>
                  )}
                  {project.status === "DONE" && (
                    <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCheck size={12} /> Completed
                    </span>
                  )}
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
                              className="text-[13px] font-semibold text-textPrimary hover:underline underline-offset-2"
                            >
                              {app.user.name}
                            </Link>
                            <span className="text-[11px] text-textMuted">
                              {app.user.department} · Year {app.user.year}
                            </span>
                          </div>
                          {app.message && (
                            <p className="text-[12px] text-textPrimary leading-relaxed bg-secondary rounded-md p-3 border border-border">
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
                  <p className="text-[12px] text-textMuted italic">No applications yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-[14px] font-medium text-textPrimary mb-1">No projects yet</p>
          <p className="text-[12px] text-textMuted mb-4">Post your first project to start finding collaborators.</p>
          <Link href="/projects/create" className="btn-primary text-[13px] py-2 px-4 inline-flex">
            Create a project
          </Link>
        </div>
      )}
    </div>
  );
}
