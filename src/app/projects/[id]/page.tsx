import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiMail, FiBookOpen, FiUser, FiClock, FiCpu, FiTag } from "react-icons/fi";
import ProjectDetailClient from "./ProjectDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+project+details.");
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          year: true,
          bio: true,
        },
      },
      skills: true,
    },
  });

  if (!project) {
    notFound();
  }

  const isLoggedIn = !!session?.user;
  const currentUserId = isLoggedIn ? Number((session?.user as any).id) : null;
  const isOwner = currentUserId === project.ownerId;

  let hasApplied = false;
  let applicationStatus = undefined;

  if (isLoggedIn && !isOwner && currentUserId) {
    const application = await prisma.application.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });

    if (application) {
      hasApplied = true;
      applicationStatus = application.status;
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "notion-tag-green";
      case "FULL":
        return "notion-tag-yellow";
      default:
        return "notion-tag-red";
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <FiBookOpen className="text-[10px]" />
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${getStatusColor(project.status)}`}>
                  {project.status} Recruitment
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FiClock />
                  Posted on {new Date(project.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 leading-tight tracking-tight">
                {project.title}
              </h1>

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Project Description
              </h3>
              <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-lg border border-border bg-card">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <FiCpu className="text-muted-foreground text-base" />
                Required Skills & Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded bg-secondary text-muted-foreground"
                  >
                    <FiTag className="text-[10px]" />
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ProjectDetailClient
              projectId={projectId}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
              hasApplied={hasApplied}
              applicationStatus={applicationStatus}
              projectStatus={project.status}
            />

            <div className="glass-panel p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-1.5">
                <FiUser className="text-muted-foreground" />
                Project Owner
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-md bg-secondary border border-border flex items-center justify-center font-bold text-foreground uppercase text-base shrink-0">
                  {project.owner.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground hover:underline">
                    <Link href={`/profile/${project.owner.id}`}>{project.owner.name}</Link>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {project.owner.department} • Year {project.owner.year}
                  </p>
                </div>
              </div>

              {project.owner.bio && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4 italic">
                  &quot;{project.owner.bio}&quot;
                </p>
              )}

              {isLoggedIn && (
                <a
                  href={`mailto:${project.owner.email}`}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 text-xs font-semibold bg-secondary text-foreground hover:bg-muted border border-border hover:border-muted-foreground rounded-lg transition-colors"
                >
                  <FiMail />
                  Contact Owner
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
