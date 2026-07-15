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
        return "notion-tag-green";
      case "FULL":
        return "notion-tag-yellow";
      case "CLOSED":
        return "notion-tag-red";
      default:
        return "notion-tag-gray";
    }
  };

  return (
    <article className="glass-panel rounded-lg p-5 hover:border-muted-foreground/30 transition-all duration-200 flex flex-col justify-between h-full bg-card">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <FiClock />
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground mb-2 line-clamp-1 hover:text-muted-foreground transition-colors">
          <Link href={`/projects/${project.id}`}>{project.title}</Link>
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {truncatedDesc}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills.map((skill) => (
            <span
              key={skill.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground uppercase">
            {project.owner.name[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground leading-none hover:underline">
              <Link href={`/profile/${project.owner.id}`}>{project.owner.name}</Link>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {project.owner.department} • Yr {project.owner.year}
            </p>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary border border-border rounded-lg transition-colors cursor-pointer"
        >
          Details
          <FiBookOpen className="text-[11px] text-muted-foreground" />
        </Link>
      </div>
    </article>
  );
}
