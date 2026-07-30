"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

interface BookmarksTabProps {
  bookmarks: any[];
  getProjectIcon: (title: string) => { icon: any; bg: string; text: string };
}

export default function BookmarksTab({ bookmarks, getProjectIcon }: BookmarksTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-textPrimary tracking-tight">Bookmarks</h2>
        <p className="text-[12px] text-textMuted mt-0.5">Projects you saved for later.</p>
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
                  <h3 className="text-[13px] font-semibold text-textPrimary group-hover:underline underline-offset-2">
                    <Link href={`/projects/${p.id}`}>{p.title}</Link>
                  </h3>
                  <p className="text-[11px] text-textMuted mt-0.5">
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
                      <span key={s.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-secondary border border-border text-textMuted">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
                  <span className="text-[10px] text-textMuted">
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
        <div className="card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-secondary border border-border/80 flex items-center justify-center mx-auto shadow-sm">
            <Bookmark size={26} strokeWidth={1.75} className="text-textPrimary" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-textPrimary">No bookmarked projects yet</h3>
            <p className="text-[12px] text-textMuted mt-1.5 leading-relaxed max-w-md mx-auto">
              Save interesting campus projects, research ideas, and hackathon opportunities to easily compare them and apply when you&apos;re ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <Link href="/dashboard?tab=home" className="btn-primary text-[12px] py-2 px-4 w-full sm:w-auto font-semibold">
              Browse Open Projects
            </Link>
            <Link href="/dashboard?tab=collaborations" className="btn-secondary text-[12px] py-2 px-4 w-full sm:w-auto font-medium">
              Find Teammates
            </Link>
          </div>

          <div className="pt-4 border-t border-border/50 text-[11px] text-textMuted flex items-center justify-center gap-1.5">
            <span>💡 <strong>Pro-Tip:</strong> Click the 🔖 bookmark button on any project card to save it here.</span>
          </div>
        </div>
      )}
    </div>
  );
}
