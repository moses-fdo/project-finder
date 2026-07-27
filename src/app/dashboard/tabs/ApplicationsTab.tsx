"use client";

import Link from "next/link";
import { Send } from "lucide-react";

interface ApplicationsTabProps {
  applications: any[];
  appStatusStyle: (status: string) => string;
}

export default function ApplicationsTab({ applications, appStatusStyle }: ApplicationsTabProps) {
  return (
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
        <div className="card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center mx-auto shadow-sm">
            <Send size={24} strokeWidth={1.75} className="text-foreground" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-foreground">No active applications</h3>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
              When you apply to join campus projects, your application status and messages to team leads will be tracked right here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <Link href="/dashboard?tab=home" className="btn-primary text-[12px] py-2 px-4 w-full sm:w-auto font-semibold">
              Explore Projects & Apply
            </Link>
          </div>

          <div className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground">
            <span>🚀 <strong>How it works:</strong> Click &ldquo;Apply to Join&rdquo; on any project card to send your pitch to the owner.</span>
          </div>
        </div>
      )}
    </div>
  );
}
