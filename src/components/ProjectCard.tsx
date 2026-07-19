"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Bookmark } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    owner: {
      id: number;
      name: string;
      department: string;
      year: number;
    };
    skills: {
      id: number;
      name: string;
    }[];
  };
  initialBookmarked?: boolean;
}

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return <span className="badge badge-green">Open</span>;
    case "FULL":
      return <span className="badge badge-yellow">Full</span>;
    case "CLOSED":
      return <span className="badge badge-red">Closed</span>;
    default:
      return <span className="badge badge-gray">{status}</span>;
  }
}

export default function ProjectCard({ project, initialBookmarked = false }: ProjectCardProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const truncatedDesc =
    project.description.length > 120
      ? `${project.description.substring(0, 120)}…`
      : project.description;

  const dateStr = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const ownerInitial = project.owner.name[0].toUpperCase();

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    const method = bookmarked ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/projects/${project.id}/bookmark`, { method });
      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch {
      /* silent */
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <article className="card card-hover flex flex-col h-full p-5 group">
      {/* Top row: status + bookmark + date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {statusBadge(project.status)}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark project"}
            title={bookmarked ? "Remove bookmark" : "Save project"}
            className={`p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
              bookmarked
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark
              size={13}
              strokeWidth={1.75}
              className={bookmarked ? "fill-foreground" : ""}
            />
          </button>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={11} strokeWidth={1.75} />
            {dateStr}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-semibold text-foreground leading-snug mb-2 line-clamp-1">
        <Link href={`/projects/${project.id}`} className="hover:underline underline-offset-2">
          {project.title}
        </Link>
      </h3>

      {/* Description */}
      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
        {truncatedDesc}
      </p>

      {/* Skills */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills.slice(0, 4).map((skill) => (
            <span
              key={skill.id}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground"
            >
              {skill.name}
            </span>
          ))}
          {project.skills.length > 4 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
              +{project.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-border">
        {/* Owner */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-semibold text-foreground shrink-0">
            {ownerInitial}
          </div>
          <div>
            <p className="text-[12px] font-medium text-foreground leading-none">
              <Link href={`/profile/${project.owner.id}`} className="hover:underline underline-offset-2">
                {project.owner.name}
              </Link>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {project.owner.department}
            </p>
          </div>
        </div>

        {/* View link */}
        <Link
          href={`/projects/${project.id}`}
          className="btn-ghost flex items-center gap-1 text-[12px] px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={0}
          aria-label={`View ${project.title}`}
        >
          View
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}
