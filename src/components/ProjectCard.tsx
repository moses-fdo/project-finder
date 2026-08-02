"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

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
}

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return <span className="badge badge-green opacity-90">Open</span>;
    case "FULL":
      return <span className="badge badge-yellow opacity-90">Full</span>;
    case "CLOSED":
      return <span className="badge badge-red opacity-90">Closed</span>;
    case "DONE":
      return <span className="badge badge-green opacity-90">✓ Done</span>;
    default:
      return <span className="badge badge-gray opacity-90">{status}</span>;
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const truncatedDesc =
    project.description.length > 120
      ? `${project.description.substring(0, 120)}…`
      : project.description;

  const dateStr = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  const ownerInitial = ((project?.owner?.name || "U").trim()[0] || "U").toUpperCase();

  return (
    <article className="card hover:shadow-lg rounded-xl border border-border bg-card flex flex-col h-full p-6 group transition-all duration-300 ease-out-quart min-w-0">
      {/* Top row: status + date */}
      <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
        {statusBadge(project.status)}
        <div className="flex items-center gap-2.5">
          <Clock size={12} strokeWidth={1.75} className="text-muted-foreground transition-transform duration-200 hover:text-primary"/>
          <span className="text-sm text-muted-foreground font-medium">{dateStr}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[16px] sm:text-[18px] font-semibold text-foreground leading-snug mb-3 line-clamp-1 break-words min-w-0 whitespace-normal">
        <Link href={`/projects/${project.id}`} className="hover:underline hover:text-primary transition-colors">
          {project.title}
        </Link>
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5 flex-1 break-words min-w-0 overflow-hidden whitespace-pre-wrap">
        {truncatedDesc}
      </p>

      {/* Skills */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-6 shrink-0">
          {project.skills.slice(0, 4).map((skill) => (
            <span
              key={skill.id}
              className="text-[11px] font-medium px-3 py-1 rounded-md bg-secondary border border-border text-muted-foreground"
            >
              {skill.name}
            </span>
          ))}
          {project.skills.length > 4 && (
            <span className="text-[11px] font-medium px-3 py-1 rounded-md bg-secondary text-muted-foreground opacity-70">
              +{project.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-5 border-t border-border shrink-0 gap-4">
        {/* Owner */}
        <div className="flex items-center gap-3 flex-1">
          <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-semibold text-foreground overflow-hidden">
            {ownerInitial}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground line-clamp-1 break-words">
              <Link href={`/profile/${project.owner.id}`} className="hover:underline hover:text-primary transition-colors">
                {project.owner.name}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">{project.owner?.department}</p>
          </div>
        </div>

        {/* View link */}
        <Link
          href={`/projects/${project.id}`}
          className="btn-ghost group/btn flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-secondary text-primary hover:bg-secondary/30 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`View ${project.title}`}
        >
          <span className="text-primary font-medium">View project</span>
          <ArrowRight size={12} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}