import Link from "next/link";
import { FiBookOpen, FiClock } from "react-icons/fi";

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

export default function ProjectCard({ project }: ProjectCardProps) {
  const truncatedDesc =
    project.description.length > 150
      ? `${project.description.substring(0, 150)}...`
      : project.description;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "FULL":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "CLOSED":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <article className="glass-panel rounded-xl p-5 hover:border-primary/30 hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FiClock />
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 hover:text-primary transition-colors">
          <Link href={`/projects/${project.id}`}>{project.title}</Link>
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {truncatedDesc}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills.map((skill) => (
            <span
              key={skill.id}
              className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary border border-border text-foreground/80"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {project.owner.name[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground leading-none hover:text-primary transition-colors">
              <Link href={`/profile/${project.owner.id}`}>{project.owner.name}</Link>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {project.owner.department} • Yr {project.owner.year}
            </p>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:text-white hover:bg-primary rounded-md border border-primary/20 hover:border-transparent transition-all duration-200"
        >
          Details
          <FiBookOpen className="text-xs" />
        </Link>
      </div>
    </article>
  );
}
