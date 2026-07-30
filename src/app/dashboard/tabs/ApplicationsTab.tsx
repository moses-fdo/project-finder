"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Trash2, Loader2 } from "lucide-react";

interface ApplicationsTabProps {
  applications: any[];
  appStatusStyle: (status: string) => string;
}

export default function ApplicationsTab({ applications: initialApplications, appStatusStyle }: ApplicationsTabProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const handleWithdraw = async (id: number) => {
    if (!confirm("Are you sure you want to withdraw this project application?")) return;

    setWithdrawingId(id);
    const previous = [...applications];
    setApplications((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setApplications(previous);
        alert("Could not withdraw application. Please try again.");
      }
    } catch {
      setApplications(previous);
      alert("Network error while withdrawing application.");
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-textPrimary tracking-tight">My applications</h2>
        <p className="text-[12px] text-textMuted mt-0.5">Track and manage your campus collaboration requests.</p>
      </div>

      {applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-150">
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-textPrimary mb-0.5 truncate">
                  <Link href={`/projects/${app.project.id}`} className="hover:underline underline-offset-2">
                    {app.project.title}
                  </Link>
                </h3>
                <p className="text-[11px] text-textMuted">
                  by{" "}
                  <Link href={`/profile/${app.project.owner?.id}`} className="hover:underline">
                    {app.project.owner?.name}
                  </Link>
                  {" · "}
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {app.message && (
                  <p className="text-[12px] text-textMuted mt-2 italic line-clamp-2">
                    &ldquo;{app.message}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                <span className={`${appStatusStyle(app.status)} shrink-0`}>
                  {app.status}
                </span>

                {app.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(app.id)}
                    disabled={withdrawingId === app.id}
                    title="Withdraw this application"
                    className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md text-textMuted hover:text-danger hover:bg-danger/10 border border-border transition-colors cursor-pointer"
                  >
                    {withdrawingId === app.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    <span>Withdraw</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center mx-auto shadow-sm">
            <Send size={24} strokeWidth={1.75} className="text-textPrimary" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-textPrimary">No active applications</h3>
            <p className="text-[12px] text-textMuted mt-1.5 leading-relaxed max-w-md mx-auto">
              When you apply to join campus projects, your application status and messages to team leads will be tracked right here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <Link href="/dashboard?tab=home" className="btn-primary text-[12px] py-2 px-4 w-full sm:w-auto font-semibold">
              Explore Projects & Apply
            </Link>
          </div>

          <div className="pt-4 border-t border-border/50 text-[11px] text-textMuted">
            <span>🚀 <strong>How it works:</strong> Click &ldquo;Apply to Join&rdquo; on any project card to send your pitch to the owner.</span>
          </div>
        </div>
      )}
    </div>
  );
}
